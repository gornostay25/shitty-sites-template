export interface PtNode {
	_type: string;
	_key: string;
	[key: string]: unknown;
}

export function getPtNode(props: Record<string, unknown>): PtNode {
	const node = props.node;
	if (!node || typeof node !== "object") {
		throw new Error("Portable Text block expected Astro.props.node");
	}
	return node as PtNode;
}
