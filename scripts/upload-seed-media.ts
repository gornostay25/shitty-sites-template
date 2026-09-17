#!/usr/bin/env bun
/**
 * Upload `seed/media/` WebP assets to R2, insert `media` rows, and patch
 * content/revision JSON that still contains `{ "$media": { "file": "…" } }`.
 *
 * Uses Wrangler (same auth as D1 import) — no EmDash admin login required.
 *
 * Usage:
 *   bun scripts/upload-seed-media.ts --local     # local R2 + local D1 (creates local D1 via wrangler if missing)
 *   bun scripts/upload-seed-media.ts --remote    # remote R2 + remote D1 (production)
 *   bun scripts/upload-seed-media.ts --dry-run
 *   bun scripts/upload-seed-media.ts --local --patch-d1-only  # patch JSON only (existing media rows)
 *
 * `bol.hero` `backgroundImage` is stored as a media_picker URL string (not `$media` or image objects).
 * After `--local`, clears Miniflare KV object cache so pages/admin see patched D1 (TTL cache otherwise keeps `$media`).
 */

import { Database } from "bun:sqlite";
import {
	existsSync,
	mkdtempSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { ulid } from "ulidx";

const cwd = process.cwd();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const patchD1Only = args.includes("--patch-d1-only");
const applyLocal = args.includes("--local");
const applyRemote = args.includes("--remote");

if (applyLocal && applyRemote) {
	console.error("Use only one of --local or --remote.");
	process.exit(1);
}
const uploadsDir = resolve(
	cwd,
	valueAfter(args, "--uploads-dir") ?? "seed/media",
);
const databaseArg = valueAfter(args, "--database");
const bucket = valueAfter(args, "--bucket") ?? "bar-of-legends-media";
const d1Name = valueAfter(args, "--d1") ?? "bar-of-legends";
const dbPath = resolve(
	databaseArg
		? resolve(cwd, databaseArg)
		: applyLocal
			? resolveLocalD1Database(d1Name)
			: resolve(cwd, ".emdash/seed-migration.db"),
);
const patchPath = resolve(cwd, valueAfter(args, "--out") ?? ".emdash/d1-media-patch.sql");

function valueAfter(argv: string[], flag: string): string | undefined {
	const i = argv.indexOf(flag);
	return i >= 0 ? argv[i + 1] : undefined;
}

/** Miniflare D1 SQLite used by `bun dev` (Wrangler local persistence). */
/** Drop cached entries from `objectCache: kvCache({ binding: "bar-of-legends-CACHE" })`. */
function purgeLocalObjectCacheKv(): void {
	const blobsDir = resolve(cwd, ".wrangler/state/v3/kv/bar-of-legends-CACHE/blobs");
	if (!existsSync(blobsDir)) return;
	for (const name of readdirSync(blobsDir)) {
		rmSync(resolve(blobsDir, name), { force: true });
	}
	console.log("Cleared local EmDash object cache (KV). Reload admin + site if content looked stale.");
}

function listLocalD1SqliteFiles(d1Dir: string): string[] {
	try {
		return readdirSync(d1Dir).filter(
			(name) => name.endsWith(".sqlite") && name !== "metadata.sqlite",
		);
	} catch {
		return [];
	}
}

/** Wrangler creates the Miniflare D1 SQLite on first `--local` execute (no `bun dev` required). */
function materializeLocalD1Database(d1: string): void {
	const d1Dir = resolve(cwd, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	if (listLocalD1SqliteFiles(d1Dir).length > 0) return;

	console.log("Local D1 SQLite missing — running wrangler d1 execute --local to create it…");
	const result = spawnSync(
		"bunx",
		["wrangler", "d1", "execute", d1, "--local", "--command", "SELECT 1", "-y"],
		{ encoding: "utf-8", cwd },
	);
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		throw new Error(
			"Could not initialize local D1. Run `bun dev` once so EmDash seeds the database, then retry.",
		);
	}
}

function resolveLocalD1Database(d1: string): string {
	const d1Dir = resolve(cwd, ".wrangler/state/v3/d1/miniflare-D1DatabaseObject");
	materializeLocalD1Database(d1);
	const entries = listLocalD1SqliteFiles(d1Dir);
	if (entries.length === 0) {
		throw new Error(
			`No local D1 database in ${d1Dir} after wrangler init. Run \`bun dev\` once, then retry.`,
		);
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

/** EmDash Block Kit `media_picker` persists the asset URL string, not a full image object. */
function normalizeBolHeroMediaPickerInBlocks(blocks: unknown[]): unknown[] {
	return blocks.map((block) => {
		if (typeof block !== "object" || block === null) return block;
		const hero = block as Record<string, unknown>;
		if (hero._type !== "bol.hero") return block;
		const bg = hero.backgroundImage;
		if (typeof bg === "object" && bg !== null && "src" in bg) {
			const src = (bg as ImageValue).src;
			if (typeof src === "string" && src.length > 0) {
				return { ...hero, backgroundImage: src };
			}
		}
		return block;
	});
}

function normalizePortableTextMediaPickers(
	table: string,
	column: string,
	parsed: unknown,
): unknown {
	if (table === "ec_pages" && column === "content" && Array.isArray(parsed)) {
		return normalizeBolHeroMediaPickerInBlocks(parsed);
	}
	if (
		table === "revisions" &&
		column === "data" &&
		typeof parsed === "object" &&
		parsed !== null &&
		Array.isArray((parsed as { content?: unknown }).content)
	) {
		const data = parsed as { content: unknown[] };
		return { ...data, content: normalizeBolHeroMediaPickerInBlocks(data.content) };
	}
	return parsed;
}

function patchValue(
	value: unknown,
	resolveImage: (file: string, alt?: string) => ImageValue,
): unknown {
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

function collectMediaFiles(db: Database): Set<string> {
	const files = new Set<string>();
	const sources = [
		"SELECT image AS json FROM ec_menu_items WHERE image LIKE '%$media%'",
		"SELECT image AS json FROM ec_gallery_items WHERE image LIKE '%$media%'",
		"SELECT image AS json FROM ec_experiences WHERE image LIKE '%$media%'",
		"SELECT content AS json FROM ec_pages WHERE content LIKE '%$media%'",
		"SELECT data AS json FROM revisions WHERE data LIKE '%$media%'",
	];

	for (const sql of sources) {
		for (const row of db.query(sql).all() as Array<{ json: string }>) {
			walkForFiles(JSON.parse(row.json), files);
		}
	}
	return files;
}

function walkForFiles(value: unknown, files: Set<string>): void {
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
	// Minimal RIFF/WebP VP8X parser for common lossy exports.
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
			const width = 1 + (bytes[dataStart + 4] | (bytes[dataStart + 5] << 8) | (bytes[dataStart + 6] << 16));
			const height = 1 + (bytes[dataStart + 7] | (bytes[dataStart + 8] << 8) | (bytes[dataStart + 9] << 16));
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

	const result = spawnSync("bunx", wranglerArgs, { encoding: "utf-8", cwd });
	if (result.status !== 0) {
		console.error(result.stderr || result.stdout);
		throw new Error(`R2 upload failed for ${storageKey}`);
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

function loadExistingUploads(db: Database): Map<string, UploadedFile> {
	const uploads = new Map<string, UploadedFile>();
	const rows = db
		.query(
			"SELECT id, filename, mime_type, size, width, height, storage_key, content_hash FROM media WHERE status = 'ready'",
		)
		.all() as Array<{
		id: string;
		filename: string;
		mime_type: string;
		size: number;
		width: number | null;
		height: number | null;
		storage_key: string;
		content_hash: string;
	}>;

	for (const row of rows) {
		uploads.set(row.filename, {
			id: row.id,
			storageKey: row.storage_key,
			filename: row.filename,
			mimeType: row.mime_type,
			size: row.size,
			contentHash: row.content_hash,
			width: row.width,
			height: row.height,
		});
	}
	return uploads;
}

function assertLocalEmDashDatabase(db: Database): void {
	const row = db
		.query("SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'ec_pages' LIMIT 1")
		.get();
	if (!row) {
		throw new Error(
			"Local D1 has no EmDash content yet. Run `bun dev`, wait until the site loads (seed runs), then retry `bun run seed:media-upload:local` (dev can stay running).",
		);
	}
}

function isSqliteCantOpen(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: string }).code === "SQLITE_CANTOPEN"
	);
}

/** Bun often cannot read live Miniflare D1 while `bun dev` runs — snapshot via sqlite3 backup. */
function openPatchDatabase(path: string): { db: Database; snapshotDir: string | null } {
	if (!applyLocal) {
		try {
			const db = new Database(path, { readonly: true });
			db.query("SELECT 1").get();
			return { db, snapshotDir: null };
		} catch (error) {
			if (!isSqliteCantOpen(error)) throw error;
		}
		return { db: new Database(path), snapshotDir: null };
	}

	try {
		const db = new Database(path, { readonly: true });
		db.query("SELECT 1").get();
		return { db, snapshotDir: null };
	} catch (error) {
		if (!isSqliteCantOpen(error)) throw error;
	}

	console.log(
		"Direct SQLite read blocked (Miniflare D1 while dev runs) — sqlite3 backup snapshot…",
	);

	const snapshotDir = mkdtempSync(join(tmpdir(), "bol-d1-read-"));
	const snapshotPath = join(snapshotDir, "snapshot.sqlite");
	const backup = spawnSync("sqlite3", [path, `.backup ${snapshotPath}`], {
		encoding: "utf-8",
		cwd,
	});
	if (backup.status !== 0) {
		rmSync(snapshotDir, { recursive: true, force: true });
		throw new Error(
			`Could not snapshot local D1 (${path}). Install \`sqlite3\`, or stop \`bun dev\` and retry.\n${backup.stderr || backup.stdout}`,
		);
	}

	const db = new Database(snapshotPath, { readonly: true });
	return { db, snapshotDir };
}

if (!existsSync(dbPath)) {
	if (applyRemote) {
		console.error(
			`Missing database file: ${dbPath}\n\n` +
				"`--remote` reads `$media.file` refs from a local SQLite snapshot (not live remote D1).\n" +
				"Create it from seed, then retry:\n\n" +
				"  bunx emdash seed seed/seed.json --database .emdash/seed-migration.db --uploads-dir seed/media\n\n" +
				"  bun run seed:media-upload\n",
		);
	} else {
		console.error(`Missing database file: ${dbPath}`);
	}
	process.exit(1);
}

/** One read-only handle — no second open on live Miniflare D1 while dev runs. */
const { db: patchDb, snapshotDir: patchDbSnapshotDir } = openPatchDatabase(dbPath);
if (applyLocal) assertLocalEmDashDatabase(patchDb);
const neededFiles = [...collectMediaFiles(patchDb)].sort();

if (neededFiles.length === 0 && !patchD1Only) {
	console.log("No $media.file references found — nothing to upload.");
	process.exit(0);
}

console.log(`Database: ${dbPath}`);

const uploads = new Map<string, UploadedFile>();

if (patchD1Only) {
	const existing = loadExistingUploads(patchDb);
	for (const filename of neededFiles) {
		const record = existing.get(filename);
		if (!record) {
			console.error(`No media row for ${filename} — run full upload first.`);
			process.exit(1);
		}
		uploads.set(filename, record);
	}
	console.log(`Patch-only: resolving ${neededFiles.length} file(s) from existing media rows.`);
} else {
	console.log(`Found ${neededFiles.length} unique seed media file(s).`);

for (const filename of neededFiles) {
	const filePath = join(uploadsDir, filename);
	const bytes = new Uint8Array(readFileSync(filePath));
	const ext = extname(filename).toLowerCase();
	const mimeType = ext === ".webp" ? "image/webp" : ext === ".png" ? "image/png" : "image/jpeg";
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
}

const resolveImage = (file: string, alt?: string) => {
	const upload = uploads.get(file);
	if (!upload) throw new Error(`Missing upload mapping for ${file}`);
	return buildImageValue(upload, alt);
};

const statements: string[] = [
	"-- Seed media patch: R2 objects + media rows + content image fields",
];

const now = new Date().toISOString();

if (!patchD1Only) {
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
}

type RowPatch = { table: string; id: string; column: string; value: string };

function collectRowPatches(table: string, column: string, idColumn = "id"): RowPatch[] {
	const patches: RowPatch[] = [];
	const rows = patchDb
		.query(`SELECT ${idColumn} AS id, ${column} AS json FROM ${table} WHERE ${column} LIKE '%$media%'`)
		.all() as Array<{ id: string; json: string }>;

	for (const row of rows) {
		const parsed = JSON.parse(row.json);
		const patched = normalizePortableTextMediaPickers(
			table,
			column,
			patchValue(parsed, resolveImage),
		);
		patches.push({
			table,
			id: row.id,
			column,
			value: JSON.stringify(patched),
		});
	}
	return patches;
}

for (const patch of [
	...collectRowPatches("ec_menu_items", "image"),
	...collectRowPatches("ec_gallery_items", "image"),
	...collectRowPatches("ec_experiences", "image"),
	...collectRowPatches("ec_pages", "content"),
	...collectRowPatches("revisions", "data"),
]) {
	statements.push(
		`UPDATE ${patch.table} SET ${patch.column} = ${sqlLiteral(patch.value)} WHERE id = ${sqlLiteral(patch.id)};`,
	);
}

patchDb.close();
if (patchDbSnapshotDir) rmSync(patchDbSnapshotDir, { recursive: true, force: true });

writeFileSync(patchPath, `${statements.join("\n")}\n`);
console.log(`Wrote ${patchPath} (${statements.length - 1} statements)`);

if ((applyLocal || applyRemote) && !dryRun) {
	const executeArgs = ["wrangler", "d1", "execute", d1Name, "--file", patchPath, "-y"];
	if (applyRemote) executeArgs.push("--remote");

	const result = spawnSync("bunx", executeArgs, { encoding: "utf-8", cwd });
	process.stdout.write(result.stdout);
	if (result.status !== 0) {
		console.error(result.stderr || "D1 patch failed");
		process.exit(1);
	}
	console.log(`Applied media patch to ${applyRemote ? "remote" : "local"} D1.`);
	if (applyLocal) purgeLocalObjectCacheKv();
} else if (!dryRun) {
	console.log(`Next (local):  bun scripts/upload-seed-media.ts --local`);
	console.log(`Next (remote): bun scripts/upload-seed-media.ts --remote`);
}
