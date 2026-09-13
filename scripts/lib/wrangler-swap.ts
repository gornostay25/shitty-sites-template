import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";

const PROD = "wrangler.prod.jsonc";
const ACTIVE = "wrangler.jsonc";

export function runWithWranglerSwap(run: () => number): number {
	if (!existsSync(PROD)) {
		console.error(`Missing ${PROD} — copy wrangler.jsonc, fill Cloudflare IDs, and retry.`);
		process.exit(1);
	}
	copyFileSync(PROD, ACTIVE);
	try {
		return run();
	} finally {
		spawnSync("git", ["restore", ACTIVE], { stdio: "inherit" });
	}
}
