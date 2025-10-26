import type { WikiHeading } from "./types";
import { slugify } from "./slug";

export function extractHeadings(content: string): WikiHeading[] {
	const lines = content.split(/\r?\n/);
	const headings: WikiHeading[] = [];

	let insideFence = false;
	let previousLine: string | null = null;

	for (const rawLine of lines) {
		const line = rawLine.trim();

		if (line.startsWith("```") || line.startsWith("~~~")) {
			insideFence = !insideFence;
			previousLine = null;
			continue;
		}

		if (insideFence) {
			continue;
		}

		const atxMatch = line.match(/^(#{1,6})\s+(.+)$/);
		if (atxMatch) {
			const [, hashes, text] = atxMatch;
			pushHeading(headings, text, hashes.length);
			previousLine = null;
			continue;
		}

		if (previousLine) {
			const isSetext = /^=+$/.test(line) || /^-+$/.test(line);
			if (isSetext) {
				const level = /^=+$/.test(line) ? 1 : 2;
				pushHeading(headings, previousLine, level);
				previousLine = null;
				continue;
			}
		}

		previousLine = line || null;
	}

	return headings;
}

function pushHeading(headings: WikiHeading[], text: string, level: number) {
	const title = text.replace(/\{#.+?\}/, "").trim();
	if (!title) return;
	const id = slugify(title);

	const duplicateCount = headings.filter((heading) => heading.id === id).length;
	const uniqueId = duplicateCount ? `${id}-${duplicateCount + 1}` : id;

	headings.push({
		id: uniqueId,
		text: title,
		level,
	});
}
