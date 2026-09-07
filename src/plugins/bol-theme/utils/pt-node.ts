/** Portable Text custom block props from astro-portabletext / EmDash. */
export function getPtNode<T extends Record<string, unknown>>(
	props: Record<string, unknown>,
): T {
	if (props.node && typeof props.node === "object") {
		return props.node as T;
	}
	const { node: _node, index: _index, isInline: _inline, ...rest } = props;
	return rest as T;
}
