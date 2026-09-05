import { apiFetch, parseApiResponse } from "@emdash-cms/admin";
import { PLUGIN_ID } from "../constants.ts";

function pluginUrl(route: string): string {
	return `/_emdash/api/plugins/${PLUGIN_ID}/${route}`;
}

export async function getPluginRoute<T>(route: string): Promise<T> {
	const response = await apiFetch(pluginUrl(route));
	return parseApiResponse<T>(response, "Plugin request failed");
}

export async function postPluginRoute<T>(
	route: string,
	body: unknown,
): Promise<T> {
	const response = await apiFetch(pluginUrl(route), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	return parseApiResponse<T>(response, "Plugin request failed");
}
