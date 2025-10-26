import path from "path";
import type { WikiFolderNode, WikiPageNode, WikiTreeNode } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export type AdminTreeNode = {
	type: "folder" | "page";
	title: string;
	name: string;
	slug: string[];
	path: string;
	order: number;
	children?: AdminTreeNode[];
	index?: AdminTreeNode | null;
	description?: string;
	lastModified?: string;
	relativePath?: string;
	headings?: WikiPageNode["headings"];
};

export function toAdminTree(folder: WikiFolderNode): AdminTreeNode {
	return serializeFolder(folder);
}

function serializeFolder(folder: WikiFolderNode): AdminTreeNode {
	return {
		type: "folder",
		title: folder.title,
		name: folder.name,
		slug: folder.slug,
		path: folder.path,
		order: folder.order,
		index: folder.indexPage ? serializePage(folder.indexPage) : null,
		children: folder.children.map((child) => serializeNode(child)),
	};
}

function serializeNode(node: WikiTreeNode): AdminTreeNode {
	if (node.type === "page") {
		return serializePage(node);
}

	return serializeFolder(node);
}

function serializePage(page: WikiPageNode): AdminTreeNode {
	return {
		type: "page",
		title: page.title,
		name: page.slug.at(-1) ?? "index",
		slug: page.slug,
		path: page.urlPath,
		order: page.order ?? 999,
		description: page.description,
		lastModified: page.lastModified,
		relativePath: toRelativePath(page.filePath),
		headings: page.headings,
	};
}

function toRelativePath(filePath: string): string {
	const relative = path.relative(CONTENT_ROOT, filePath);
	return relative.replace(/\\/g, "/");
}
