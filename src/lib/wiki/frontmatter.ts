import type { WikiFrontmatterParseResult, WikiPageMetadata } from "./types";

const FRONTMATTER_REGEX = /^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*/;

export function parseFrontmatter(source: string): WikiFrontmatterParseResult {
	const match = source.match(FRONTMATTER_REGEX);

	if (!match) {
		return {
			content: source.trimStart(),
			metadata: {},
		};
	}

	const [, rawBlock] = match;
	const metadata = parseMetadataBlock(rawBlock);
	const content = source.slice(match[0].length).trimStart();

	return {
		content,
		metadata,
	};
}

function parseMetadataBlock(block: string): Partial<WikiPageMetadata> {
	const lines = block
		.split(/\r?\n/g)
		.map((line) => line.trim())
		.filter(Boolean);

	const metadata: Partial<WikiPageMetadata> = {};

	for (const line of lines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;
		const key = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();

		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}

		if (value.startsWith("[") && value.endsWith("]")) {
			try {
				const parsed = JSON.parse(value.replace(/(['"])?([a-zA-Z0-9_-]+)(['"])?/g, '"$2"'));
				(metadata as Record<string, unknown>)[key] = parsed;
				continue;
			} catch {
				// fall through to string assignment
			}
		}

		if (value === "true" || value === "false") {
			(metadata as Record<string, unknown>)[key] = value === "true";
			continue;
		}

		const numeric = Number(value);
		if (!Number.isNaN(numeric) && value !== "") {
			(metadata as Record<string, unknown>)[key] = numeric;
			continue;
		}

		(metadata as Record<string, unknown>)[key] = value;
	}

	return metadata;
}
