const NON_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}\s-]/gu;
const WHITESPACE_REGEX = /\s+/g;
const DASH_REGEX = /-+/g;

export function slugify(value: string): string {
	return value
		.normalize("NFKD")
		.replace(NON_ALPHANUMERIC_REGEX, "")
		.trim()
		.replace(WHITESPACE_REGEX, "-")
		.replace(DASH_REGEX, "-")
		.toLowerCase();
}

export function segmentsToPath(segments: string[]): string {
	return segments.join("/");
}

export function pathToSegments(path: string): string[] {
	return path.split("/").filter(Boolean);
}

export function segmentsEqual(a: string[], b: string[]): boolean {
	if (a.length !== b.length) return false;
	return a.every((segment, index) => segment === b[index]);
}
