#!/usr/bin/env bun
/// <reference types="bun" />
/**
 * Convert a local EmDash SQLite file (from `emdash seed`) into a D1-safe SQL file.
 *
 * sqlite3 .dump is not D1-compatible for FTS5:
 * - INSERT INTO sqlite_schema → rewrite as CREATE VIRTUAL TABLE
 * - PRAGMA writable_schema / BEGIN TRANSACTION → stripped
 * - Shadow tables (_fts_*_data, _content, …) → D1 reserves those names; re-insert via the virtual table
 *
 * Usage:
 *   bun scripts/d1-export-seed-db.ts [.emdash/seed-migration.db] [.emdash/d1-import.sql]
 */

import { Database } from "bun:sqlite";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

const cwd = process.cwd();
const dbPath = resolve(cwd, process.argv[2] ?? ".emdash/seed-migration.db");
const outPath = resolve(cwd, process.argv[3] ?? ".emdash/d1-import.sql");

const FTS_SHADOW = /_emdash_fts_(?:pages|menu_items|experiences)_(?:data|idx|content|docsize|config)\b/;

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

// Drop FTS shadow-table DDL/DML; D1 manages these internally for fts5 virtual tables.
sql = sql
	.split("\n")
	.filter((line) => !FTS_SHADOW.test(line))
	.join("\n");

function sqlLiteral(value: unknown): string {
	if (value === null || value === undefined) return "NULL";
	return `'${String(value).replace(/'/g, "''")}'`;
}

const ftsTables = [
	{
		name: "_emdash_fts_pages",
		columns: ["id", "locale", "title", "content"],
	},
	{
		name: "_emdash_fts_menu_items",
		columns: ["id", "locale", "name", "description"],
	},
	{
		name: "_emdash_fts_experiences",
		columns: ["id", "locale", "title", "description"],
	},
] as const;

const db = new Database(dbPath, { readonly: true });
const ftsInserts: string[] = [];

for (const fts of ftsTables) {
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
