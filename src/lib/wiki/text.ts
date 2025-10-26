const MDX_CODE_BLOCK = /```[\s\S]*?```/g;
const MDX_HTML_TAG = /<[^>]+>/g;
const MDX_MARKDOWN_SYMBOLS = /[#>*_\[\]()`~\-]/g;
const WHITESPACE = /\s+/g;

export function stripMarkdown(source: string): string {
	return source
		.replace(MDX_CODE_BLOCK, " ")
		.replace(MDX_HTML_TAG, " ")
		.replace(MDX_MARKDOWN_SYMBOLS, " ")
		.replace(WHITESPACE, " ")
		.trim();
}

export function createExcerpt(source: string, length = 200): string {
	const plain = stripMarkdown(source);
	return plain.slice(0, length).trim();
}

export function createSnippet(source: string, query: string, length = 160): string {
	const plain = stripMarkdown(source);
	if (!query) {
		return plain.slice(0, length).trim();
	}

	const normalizedPlain = plain.toLowerCase();
	const normalizedQuery = query.toLowerCase();
	const index = normalizedPlain.indexOf(normalizedQuery);

	if (index === -1) {
		return plain.slice(0, length).trim();
	}

	const start = Math.max(index - Math.floor(length / 2), 0);
	const end = Math.min(start + length, plain.length);

	return plain.slice(start, end).trim();
}
