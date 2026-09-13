#!/usr/bin/env bun
/// <reference types="bun" />
/**
 * Convert a local EmDash SQLite file (from `emdash seed`) into a D1-safe SQL file.
 *
 * Usage:
 *   bun scripts/d1-export-seed-db.ts [.emdash/seed-migration.db] [.emdash/d1-import.sql]
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const dbPath = resolve(cwd, process.argv[2] ?? ".emdash/seed-migration.db");
const outPath = resolve(cwd, process.argv[3] ?? ".emdash/d1-import.sql");

const FTS_SHADOW = /_emdash_fts_.*_(?:data|idx|content|docsize|config)\b/;

function discoverFtsTables(db: Database): Array<{ name: string; columns: string[] }> {
	const tables = db
		.query(
			`SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE '_emdash_fts_%'`,
		)
		.all() as Array<{ name: string; sql: string }>;

	return tables
		.filter((t) => !/_((data|idx|content|docsize|config))$/.test(t.name))
		.map((t) => {
			const usingMatch = t.sql.match(/USING fts5\(([^)]+)\)/i);
			const columns = usingMatch
				? usingMatch[1]
						.split(",")
						.map((c) => c.trim().replace(/"/g, ""))
						.filter((c) => c && !c.includes("="))
				: [];
			return { name: t.name, columns };
		});
}

const dump = spawnSync("sqlite3", [dbPath, ".dump"], { encoding: "utf-8" });
if (dump.status !== 0) {
	console.error(dump.stderr || "sqlite3 .dump failed");
	process.exit(1);
}

let sql = dump.stdout.replace(/^\/\* WARNING:.*\*\/\n?/m, "");

sql = sql.replace(/^PRAGMA writable_schema=(ON|OFF);\n?/gm, "");
sql = sql.replace(/^PRAGMA foreign_keys=OFF;\n?/gm, "");
sql = sql.replace(/^BEGIN TRANSACTION;\n?/gm, "");
sql = sql.replace(/^COMMIT;\n?/gm, "");

sql = sql.replace(/^INSERT INTO sqlite_schema\([^;]+;/gms, (block) => {
	const match = block.match(/'CREATE VIRTUAL TABLE[^']+(?:''[^']*)*'/);
	if (!match) return "";
	const ddl = match[0].slice(1, -1).replace(/''/g, "'");
	return `${ddl};\n`;
});

sql = sql.replace(/^INSERT INTO sqlite_master\([^;]+;/gms, "");

sql = sql
	.split("\n")
	.filter((line) => !FTS_SHADOW.test(line))
	.join("\n");

function sqlLiteral(value: unknown): string {
	if (value === null || value === undefined) return "NULL";
	return `'${String(value).replace(/'/g, "''")}'`;
}

const db = new Database(dbPath, { readonly: true });
const ftsTables = discoverFtsTables(db);
const ftsInserts: string[] = [];

for (const fts of ftsTables) {
	if (fts.columns.length === 0) continue;
	const colList = fts.columns.join(", ");
	const rows = db
		.query(`SELECT ${colList} FROM "${fts.name}"`)
		.all() as Record<string, unknown>[];

	for (const row of rows) {
		const values = fts.columns.map((col) => sqlLiteral(row[col])).join(", ");
		ftsInserts.push(`INSERT INTO "${fts.name}" (${colList}) VALUES (${values});`);
	}
}

db.close();

if (ftsInserts.length) {
	sql = `${sql.trimEnd()}\n\n-- FTS rows (via virtual table; shadow tables omitted for D1)\n${ftsInserts.join("\n")}\n`;
}

writeFileSync(outPath, sql);
console.log(`Wrote ${outPath} (${ftsInserts.length} FTS rows)`);

if (/INSERT INTO sqlite_(schema|master)/.test(sql)) {
	console.error("Warning: dump still contains sqlite catalog INSERTs");
	process.exit(1);
}

if (FTS_SHADOW.test(sql)) {
	console.error("Warning: dump still contains FTS shadow-table statements");
	process.exit(1);
}
