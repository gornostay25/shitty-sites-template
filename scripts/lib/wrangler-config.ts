import { readFileSync } from "node:fs";

export interface WranglerConfig {
	workerName: string;
	d1DatabaseName: string;
	r2BucketName: string;
}

export function parseWranglerConfig(configPath: string): WranglerConfig {
	const raw = readFileSync(configPath, "utf-8")
		.replace(/\/\/.*$/gm, "")
		.replace(/,\s*([\]}])/g, "$1");
	const config = JSON.parse(raw);
	return {
		workerName: config.name,
		d1DatabaseName: config.d1_databases?.[0]?.database_name ?? config.name,
		r2BucketName: config.r2_buckets?.[0]?.bucket_name ?? `${config.name}-media`,
	};
}
