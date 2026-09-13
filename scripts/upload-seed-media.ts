#!/usr/bin/env bun
/**
 * Upload `seed/media/` seed images to R2, insert `media` rows, and patch
 * content/revision JSON that still contains `{ "$media": { "file": "…" } }`.
 *
 * Usage:
 *   bun scripts/upload-seed-media.ts --local
 *   bun scripts/upload-seed-media.ts --remote
 *   bun scripts/upload-seed-media.ts --dry-run
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { ulid } from "ulidx";
import { parseWranglerConfig } from "./lib/wrangler-config.ts";
import { runWithWranglerSwap } from "./lib/wrangler-swap.ts";

const cwd = process.cwd();
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const applyLocal = args.includes("--local");
const applyRemote = args.includes("--remote");

if (applyLocal && applyRemote) {
	console.error("Use only one of --local or --remote.");
	process.exit(1);
}

const uploadsDir = resolve(cwd, valueAfter(args, "--uploads-dir") ?? "seed/media");
const databaseArg = valueAfter(args, "--database");
const configPath = applyRemote ? "wrangler.prod.jsonc" : "wrangler.jsonc";
const wranglerConfig = parseWranglerConfig(resolve(cwd, configPath));
const bucket = valueAfter(args, "--bucket") ?? wranglerConfig.r2BucketName;
const d1Name = valueAfter(args, "--d1") ?? wranglerConfig.d1DatabaseName;
const patchPath = resolve(cwd, valueAfter(args, "--out") ?? ".emdash/d1-media-patch.sql");

const dbPath = databaseArg
	? resolve(cwd, databaseArg)
	: applyLocal
		? resolveLocalD1Database()
		: resolve(cwd, ".emdash/seed-migration.db");

function valueAfter(argv: string[], flag: string): string | undefined {
	const i = argv.indexOf(flag);
	return i >= 0 ? argv[i + 1] : undefined;
}

function resolveLocalD1Database(): string {
	const d1Dir = resolve(cwd, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	let entries: string[];
	try {
		entries = readdirSync(d1Dir).filter(
			(name) => name.endsWith(".sqlite") && name !== "metadata.sqlite",
		);
	} catch {
		throw new Error(
			`Local D1 not found at ${d1Dir}. Start the dev server (bun dev) once, then retry.`,
		);
	}
	if (entries.length === 0) {
		throw new Error(`No local D1 database in ${d1Dir}. Run bun dev first.`);
	}
	if (entries.length > 1) {
		throw new Error(
			`Multiple local D1 databases in ${d1Dir}: ${entries.join(", ")}. Pass --database explicitly.`,
		);
	}
	return resolve(d1Dir, entries[0]!);
}

interface ImageValue {
	id: string;
	src: string;
	alt?: string;
	width?: number;
	height?: number;
	filename?: string;
	mimeType?: string;
	meta: { storageKey: string };
}

interface UploadedFile {
	id: string;
	storageKey: string;
	filename: string;
	mimeType: string;
	size: number;
	contentHash: string;
	width: number | null;
	height: number | null;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
	if (
		bytes.buffer instanceof ArrayBuffer &&
		bytes.byteOffset === 0 &&
		bytes.byteLength === bytes.buffer.byteLength
	) {
		return bytes.buffer;
	}
	const buf = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(buf).set(bytes);
	return buf;
}

async function computeContentHash(bytes: Uint8Array): Promise<string> {
	const hashBuffer = await crypto.subtle.digest("SHA-1", toArrayBuffer(bytes));
	const hashHex = Array.from(new Uint8Array(hashBuffer), (byte) =>
		byte.toString(16).padStart(2, "0"),
	).join("");
	return `sha1:${hashHex}`;
}

function sqlLiteral(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

function isMediaRef(value: unknown): value is { $media: { file: string; alt?: string } } {
	return (
		typeof value === "object" &&
		value !== null &&
		"$media" in value &&
		typeof (value as { $media?: unknown }).$media === "object" &&
		(value as { $media: { file?: unknown } }).$media !== null &&
		typeof (value as { $media: { file?: unknown } }).$media.file === "string"
	);
}

function isImageFieldWithVariants(
	value: unknown,
): value is { $media: { file: string; alt?: string }; darkVariant?: unknown } {
	return (
		typeof value === "object" &&
		value !== null &&
		"$media" in value &&
		isMediaRef({ $media: (value as { $media: unknown }).$media })
	);
}

function patchImageField(
	value: { $media: { file: string; alt?: string }; darkVariant?: unknown },
	resolveImage: (file: string, alt?: string) => ImageValue,
): ImageValue & { darkVariant?: ImageValue } {
	const resolved = resolveImage(value.$media.file, value.$media.alt);
	if (value.darkVariant && isImageFieldWithVariants(value.darkVariant)) {
		return { ...resolved, darkVariant: patchImageField(value.darkVariant, resolveImage) };
	}
	return resolved;
}

function patchValue(
	value: unknown,
	resolveImage: (file: string, alt?: string) => ImageValue,
): unknown {
	if (isImageFieldWithVariants(value)) {
		return patchImageField(value, resolveImage);
	}
	if (isMediaRef(value)) {
		return resolveImage(value.$media.file, value.$media.alt);
	}
	if (Array.isArray(value)) {
		return value.map((item) => patchValue(item, resolveImage));
	}
	if (typeof value === "object" && value !== null) {
		const out: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) {
			out[key] = patchValue(child, resolveImage);
		}
		return out;
	}
	return value;
}

function discoverContentTables(db: Database): string[] {
	return (
		db
			.query(`SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ec_%'`)
			.all() as Array<{ name: string }>
	).map((r) => r.name);
}

function collectMediaFiles(db: Database): Set<string> {
	const files = new Set<string>();
	const tables = [...discoverContentTables(db), "revisions"];
	for (const table of tables) {
		const columns = db
			.query(`PRAGMA table_info("${table}")`)
			.all() as Array<{ name: string; type: string }>;
		for (const col of columns.filter((c) => c.type.includes("TEXT") || c.type.includes("JSON"))) {
			let rows: Array<{ json: string }>;
			try {
				rows = db
					.query(
						`SELECT ${col.name} AS json FROM "${table}" WHERE ${col.name} LIKE '%$media%file%'`,
					)
					.all() as Array<{ json: string }>;
			} catch {
				continue;
			}
			for (const row of rows) {
				walkForFiles(JSON.parse(row.json), files);
			}
		}
	}
	return files;
}

function walkForFiles(value: unknown, files: Set<string>): void {
	if (isImageFieldWithVariants(value)) {
		files.add(value.$media.file);
		if (value.darkVariant) walkForFiles(value.darkVariant, files);
		return;
	}
	if (isMediaRef(value)) {
		files.add(value.$media.file);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) walkForFiles(item, files);
		return;
	}
	if (typeof value === "object" && value !== null) {
		for (const child of Object.values(value)) walkForFiles(child, files);
	}
}

function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
	if (bytes.length < 30) return null;
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	if (
		String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]) !== "RIFF" ||
		String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]) !== "WEBP"
	) {
		return null;
	}

	let offset = 12;
	while (offset + 8 <= bytes.length) {
		const chunk = String.fromCharCode(
			bytes[offset],
			bytes[offset + 1],
			bytes[offset + 2],
			bytes[offset + 3],
		);
		const size = view.getUint32(offset + 4, true);
		const dataStart = offset + 8;
		if (chunk === "VP8X" && size >= 6 && dataStart + 10 <= bytes.length) {
			const width =
				1 +
				(bytes[dataStart + 4] | (bytes[dataStart + 5] << 8) | (bytes[dataStart + 6] << 16));
			const height =
				1 +
				(bytes[dataStart + 7] | (bytes[dataStart + 8] << 8) | (bytes[dataStart + 9] << 16));
			return { width, height };
		}
		offset = dataStart + size + (size % 2);
	}
	return null;
}

function uploadToR2(
	storageKey: string,
	filePath: string,
	mimeType: string,
	remote: boolean,
): void {
	const wranglerArgs = [
		"wrangler",
		"r2",
		"object",
		"put",
		`${bucket}/${storageKey}`,
		"--file",
		filePath,
		"--content-type",
		mimeType,
	];
	if (remote) wranglerArgs.push("--remote");

	const run = () => {
		const result = spawnSync("bunx", wranglerArgs, { encoding: "utf-8", cwd });
		if (result.status !== 0) {
			console.error(result.stderr || result.stdout);
			throw new Error(`R2 upload failed for ${storageKey}`);
		}
		return result.status ?? 1;
	};

	if (remote) {
		runWithWranglerSwap(run);
	} else {
		run();
	}
}

function buildImageValue(upload: UploadedFile, alt?: string): ImageValue {
	return {
		id: upload.id,
		src: `/_emdash/api/media/file/${upload.storageKey}`,
		alt,
		width: upload.width ?? undefined,
		height: upload.height ?? undefined,
		filename: upload.filename,
		mimeType: upload.mimeType,
		meta: { storageKey: upload.storageKey },
	};
}

type RowPatch = { table: string; id: string; column: string; value: string };

function collectRowPatchesForColumn(
	db: Database,
	table: string,
	column: string,
	idColumn = "id",
): RowPatch[] {
	const patches: RowPatch[] = [];
	let rows: Array<{ id: string; json: string }>;
	try {
		rows = db
			.query(
				`SELECT ${idColumn} AS id, ${column} AS json FROM "${table}" WHERE ${column} LIKE '%$media%file%'`,
			)
			.all() as Array<{ id: string; json: string }>;
	} catch {
		return patches;
	}

	for (const row of rows) {
		const parsed = JSON.parse(row.json);
		const patched = patchValue(parsed, resolveImage);
		patches.push({
			table,
			id: row.id,
			column,
			value: JSON.stringify(patched),
		});
	}
	return patches;
}

function collectRowPatches(db: Database): RowPatch[] {
	const patches: RowPatch[] = [];
	for (const table of discoverContentTables(db)) {
		const columns = db
			.query(`PRAGMA table_info("${table}")`)
			.all() as Array<{ name: string; type: string }>;
		for (const col of columns.filter((c) => c.type.includes("TEXT") || c.type.includes("JSON"))) {
			patches.push(...collectRowPatchesForColumn(db, table, col.name));
		}
	}
	patches.push(...collectRowPatchesForColumn(db, "revisions", "data"));
	return patches;
}

const db = new Database(dbPath, { readonly: true });
const neededFiles = [...collectMediaFiles(db)].sort();
db.close();

if (neededFiles.length === 0) {
	console.log("No $media.file references found — nothing to upload.");
	process.exit(0);
}

console.log(`Database: ${dbPath}`);
console.log(`Found ${neededFiles.length} unique seed media file(s).`);

const uploads = new Map<string, UploadedFile>();

for (const filename of neededFiles) {
	const filePath = join(uploadsDir, filename);
	const bytes = new Uint8Array(readFileSync(filePath));
	const ext = extname(filename).toLowerCase();
	const mimeType =
		ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
	const contentHash = await computeContentHash(bytes);
	const dims = readWebpDimensions(bytes);
	const storageKey = `${ulid()}${ext || ".webp"}`;
	const id = ulid();

	const record: UploadedFile = {
		id,
		storageKey,
		filename,
		mimeType,
		size: bytes.byteLength,
		contentHash,
		width: dims?.width ?? null,
		height: dims?.height ?? null,
	};

	if (!dryRun) {
		uploadToR2(storageKey, filePath, mimeType, applyRemote);
		const target = applyRemote ? "R2 remote" : "R2 local";
		console.log(`↑ ${target} ${filename} → ${storageKey}`);
	} else {
		console.log(`DRY  ${filename} → ${storageKey}`);
	}

	uploads.set(filename, record);
}

function resolveImage(file: string, alt?: string) {
	const upload = uploads.get(file);
	if (!upload) throw new Error(`Missing upload mapping for ${file}`);
	return buildImageValue(upload, alt);
}

const patchDb = new Database(dbPath, { readonly: true });
const rowPatches = collectRowPatches(patchDb);
patchDb.close();

const statements: string[] = ["-- Seed media patch: R2 objects + media rows + content image fields"];
const now = new Date().toISOString();

for (const upload of uploads.values()) {
	statements.push(
		`INSERT INTO media (id, filename, mime_type, size, width, height, alt, storage_key, content_hash, status, created_at) VALUES (${[
			sqlLiteral(upload.id),
			sqlLiteral(upload.filename),
			sqlLiteral(upload.mimeType),
			String(upload.size),
			upload.width ?? "NULL",
			upload.height ?? "NULL",
			"NULL",
			sqlLiteral(upload.storageKey),
			sqlLiteral(upload.contentHash),
			sqlLiteral("ready"),
			sqlLiteral(now),
		].join(", ")});`,
	);
}

for (const patch of rowPatches) {
	statements.push(
		`UPDATE ${patch.table} SET ${patch.column} = ${sqlLiteral(patch.value)} WHERE id = ${sqlLiteral(patch.id)};`,
	);
}

writeFileSync(patchPath, `${statements.join("\n")}\n`);
console.log(`Wrote ${patchPath} (${statements.length - 1} statements)`);

if ((applyLocal || applyRemote) && !dryRun) {
	const executeArgs = ["wrangler", "d1", "execute", d1Name, "--file", patchPath, "-y"];
	if (applyRemote) executeArgs.push("--remote");

	const run = () => {
		const result = spawnSync("bunx", executeArgs, { encoding: "utf-8", cwd });
		process.stdout.write(result.stdout);
		if (result.status !== 0) {
			console.error(result.stderr || "D1 patch failed");
			process.exit(1);
		}
		return result.status ?? 1;
	};

	if (applyRemote) {
		runWithWranglerSwap(run);
	} else {
		run();
	}
	console.log(`Applied media patch to ${applyRemote ? "remote" : "local"} D1.`);
} else if (!dryRun) {
	console.log("Next (local):  bun run seed:media-upload:local");
	console.log("Next (remote): bun run seed:media-upload");
}
