import { getAllWikiPages } from "./content";
import { getBreadcrumbsForSlug } from "./navigation";
import { segmentsToPath } from "./slug";
import type { WikiSearchDocument } from "./types";
import { createSnippet, stripMarkdown } from "./text";

export async function searchWiki(query: string): Promise<WikiSearchDocument[]> {
	const normalizedQuery = query.trim().toLowerCase();
	const tokens = normalizedQuery.split(/\s+/g).filter(Boolean);

	const pages = await getAllWikiPages();
	const breadcrumbsPromises = pages.map((page) => getBreadcrumbsForSlug(page.slug));
	const breadcrumbSets = await Promise.all(breadcrumbsPromises);

	const scoredResults = pages
		.map((page, index) => {
			const breadcrumbs = breadcrumbSets[index];
			const hierarchicalPath = breadcrumbs.map((crumb) => crumb.title).join(" / ") || page.title;
			const searchableContent = [
				page.title,
				page.description ?? "",
				page.headings.map((heading) => heading.text).join(" "),
				page.content,
			].join("\n");

			const plainContent = stripMarkdown(searchableContent);

			const titleScore = scoreText(page.title, tokens);
			const descriptionScore = scoreText(page.description ?? "", tokens);
			const contentScore = scoreText(plainContent, tokens);

			const totalScore = titleScore * 5 + descriptionScore * 2 + contentScore;

			if (tokens.length > 0 && totalScore === 0) {
				return null;
			}

			const snippetSource = [page.headings.map((heading) => heading.text).join(" "), page.content].join("\n");

			const matches: WikiSearchDocument["matches"] = [];
			if (titleScore > 0) {
				matches.push({
					field: "title",
					text: page.title,
				});
			}
			if (descriptionScore > 0 && page.description) {
				matches.push({
					field: "description",
					text: page.description,
				});
			}
			if (contentScore > 0) {
				matches.push({
					field: "content",
					text: createSnippet(snippetSource, normalizedQuery),
				});
			}

			const urlPath = segmentsToPath(page.slug);

			return {
				score: totalScore || 0.1,
				document: {
					id: page.id,
					title: page.title,
					description: page.description,
					urlPath,
					path: hierarchicalPath,
					snippet: createSnippet(snippetSource, normalizedQuery),
					matches,
				},
			};
		})
		.filter((result): result is NonNullable<typeof result> => Boolean(result));

	return scoredResults.sort((a, b) => b.score - a.score).map((result) => result.document);
}

function scoreText(text: string, tokens: string[]): number {
	if (!text || tokens.length === 0) return 1;
	const normalized = text.toLowerCase();
	return tokens.reduce((score, token) => (normalized.includes(token) ? score + 1 : score), 0);
}
