import { getWikiTree } from "./content";
import type { WikiFolderNode, WikiPageNode } from "./types";
import { pathToSegments, segmentsEqual, segmentsToPath } from "./slug";

export interface Breadcrumb {
	title: string;
	slug: string[];
	urlPath: string;
	type: "folder" | "page";
}

async function getBreadcrumbsByPath(path: string): Promise<Breadcrumb[]> {
	const root = await getWikiTree();

	const slug = pathToSegments(path);
	const initialTrail = root.indexPage
		? [
				{
					title: root.indexPage.title,
					slug: [],
					urlPath: "",
					type: "page" as const,
				},
			]
		: [];

	if (slug.length === 0) {
		return initialTrail;
	}

	const breadcrumbs = buildBreadcrumbs(root, slug, initialTrail);
	return breadcrumbs ?? initialTrail;
}

export async function getBreadcrumbsForSlug(slug: string[]): Promise<Breadcrumb[]> {
	return getBreadcrumbsByPath(segmentsToPath(slug));
}

function buildBreadcrumbs(
	folder: WikiFolderNode,
	targetSlug: string[],
	trail: Breadcrumb[],
): Breadcrumb[] | null {
	for (const node of folder.children) {
		if (node.type === "page") {
			if (segmentsEqual(node.slug, targetSlug)) {
				return [...trail, pageToBreadcrumb(node)];
			}
		} else {
			const folderCrumb =
				node.slug.length > 0
					? ({
							title: node.title,
							slug: node.slug,
							urlPath: segmentsToPath(node.slug),
							type: "folder" as const,
						} satisfies Breadcrumb)
					: null;

			const nextTrail = folderCrumb ? [...trail, folderCrumb] : trail;

			if (node.indexPage && segmentsEqual(node.indexPage.slug, targetSlug)) {
				return [...nextTrail, pageToBreadcrumb(node.indexPage)];
			}

			const nested = buildBreadcrumbs(node, targetSlug, nextTrail);
			if (nested) {
				return nested;
			}
		}
	}

	return null;
}

function pageToBreadcrumb(page: WikiPageNode): Breadcrumb {
	return {
		title: page.title,
		slug: page.slug,
		urlPath: page.urlPath,
		type: "page",
	};
}
