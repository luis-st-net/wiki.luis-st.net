import { promises as fs } from "fs";
import path from "path";
import { parseFrontmatter } from "./frontmatter";
import { extractHeadings } from "./headings";
import { segmentsEqual, segmentsToPath } from "./slug";
import { createExcerpt } from "./text";
import type { WikiFolderNode, WikiPageMetadata, WikiPageNode, WikiTreeNode } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const MDX_EXTENSION = ".mdx";

type LoadPageOptions = {
	slug: string[];
	filename: string;
};

export async function getWikiTree(): Promise<WikiFolderNode> {
	await ensureContentRoot();
	const children = await readFolder(CONTENT_ROOT, []);

	const indexPage = children.find(
		(node): node is WikiPageNode => node.type === "page" && node.slug.length === 0,
	);

	return {
		type: "folder",
		name: "wiki",
		title: indexPage?.title ?? "Wiki",
		slug: [],
		path: "",
		order: indexPage?.order ?? 0,
		indexPage,
		children: sortNodes(children),
	};
}

export async function getAllWikiPages(): Promise<WikiPageNode[]> {
	const root = await getWikiTree();
	return flattenPages(root.children);
}

export async function getWikiPage(slug: string[]): Promise<WikiPageNode | null> {
	await ensureContentRoot();
	const resolved = await resolvePageFilePath(slug);
	if (!resolved) return null;
	return loadPage(resolved.filePath, { slug: resolved.slug, filename: resolved.filename });
}

export async function ensureContentRoot(): Promise<void> {
	try {
		await fs.access(CONTENT_ROOT);
	} catch {
		await fs.mkdir(CONTENT_ROOT, { recursive: true });
	}
}

async function readFolder(directory: string, slug: string[]): Promise<WikiTreeNode[]> {
	const dirents = await fs.readdir(directory, { withFileTypes: true });
	const nodes: WikiTreeNode[] = [];

	for (const entry of dirents) {
		if (entry.isDirectory()) {
			const childSlug = [...slug, entry.name];
			const childPath = path.join(directory, entry.name);
			const childNodes = await readFolder(childPath, childSlug);
			const indexPage = childNodes.find(
				(node): node is WikiPageNode => node.type === "page" && segmentsEqual(node.slug, childSlug),
			);

			const folderNode: WikiFolderNode = {
				type: "folder",
				name: entry.name,
				title: indexPage?.title ?? formatTitle(entry.name),
				slug: childSlug,
				path: segmentsToPath(childSlug),
				order: indexPage?.order ?? 999,
				indexPage: indexPage ?? null,
				children: sortNodes(childNodes),
			};

			nodes.push(folderNode);
		} else if (entry.isFile() && entry.name.endsWith(MDX_EXTENSION)) {
			const filename = entry.name.slice(0, -MDX_EXTENSION.length);
			const filePath = path.join(directory, entry.name);
			const slugForPage = filename === "index" ? slug : [...slug, filename];

			const pageNode = await loadPage(filePath, { slug: slugForPage, filename });
			nodes.push(pageNode);
		}
	}

	return sortNodes(nodes);
}

async function loadPage(filePath: string, options: LoadPageOptions): Promise<WikiPageNode> {
	const rawFile = await fs.readFile(filePath, "utf8");
	const { content, metadata } = parseFrontmatter(rawFile);
	const headings = extractHeadings(content);

	const stat = await fs.stat(filePath);
	const lastModified = stat.mtime.toISOString();

	const inferredTitle = inferTitle(options.slug, options.filename);
	const title = metadata.title?.toString().trim() || inferredTitle;

	const description =
		typeof metadata.description === "string" && metadata.description.trim().length > 0
			? metadata.description.trim()
			: createExcerpt(content, 160);

	const order = normaliseOrder(metadata.order);

	const slugPath = options.slug;

	return {
		type: "page",
		id: segmentsToPath(slugPath.length ? slugPath : ["index"]),
		slug: slugPath,
		filePath,
		urlPath: segmentsToPath(slugPath),
		title,
		description,
		order,
		content,
		headings,
		excerpt: createExcerpt(content, 200),
		lastModified,
	};
}

function normaliseOrder(order: WikiPageMetadata["order"]): number {
	if (typeof order === "number" && Number.isFinite(order)) {
		return order;
	}
	return 999;
}

async function resolvePageFilePath(
	slug: string[],
): Promise<{ filePath: string; slug: string[]; filename: string } | null> {
	const directPath = path.join(CONTENT_ROOT, ...slug) + MDX_EXTENSION;
	if (await exists(directPath)) {
		return {
			filePath: directPath,
			slug,
			filename: slug.at(-1) ?? "index",
		};
	}

	const indexPath = path.join(CONTENT_ROOT, ...slug, "index" + MDX_EXTENSION);
	if (await exists(indexPath)) {
		return {
			filePath: indexPath,
			slug,
			filename: "index",
		};
	}

	return null;
}

async function exists(targetPath: string): Promise<boolean> {
	try {
		await fs.stat(targetPath);
		return true;
	} catch {
		return false;
	}
}

function inferTitle(slug: string[], filename: string): string {
	if (slug.length === 0) {
		return "Home";
	}

	if (filename === "index") {
		return formatTitle(slug[slug.length - 1]);
	}

	return formatTitle(filename);
}

function formatTitle(value: string): string {
	return value
		.split(/[-_]/g)
		.filter(Boolean)
		.map((part) => {
			const trimmed = part.trim();
			if (!trimmed) return trimmed;
			return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
		})
		.join(" ");
}

function sortNodes(nodes: WikiTreeNode[]): WikiTreeNode[] {
	return [...nodes].sort((a, b) => {
		const orderA = getNodeOrder(a);
		const orderB = getNodeOrder(b);

		if (orderA !== orderB) {
			return orderA - orderB;
		}

		const titleA = getNodeTitle(a);
		const titleB = getNodeTitle(b);
		return titleA.localeCompare(titleB, undefined, { sensitivity: "base" });
	});
}

function getNodeOrder(node: WikiTreeNode): number {
	return node.type === "page" ? node.order ?? 999 : node.order;
}

function getNodeTitle(node: WikiTreeNode): string {
	return node.type === "page" ? node.title : node.title;
}

function flattenPages(nodes: WikiTreeNode[]): WikiPageNode[] {
	const pages: WikiPageNode[] = [];

	for (const node of nodes) {
		if (node.type === "page") {
			pages.push(node);
		} else {
			pages.push(...flattenPages(node.children));
		}
	}

	return pages;
}
