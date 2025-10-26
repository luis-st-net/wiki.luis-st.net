export type WikiSlug = string[];

export interface WikiHeading {
	id: string;
	text: string;
	level: number;
}

export interface WikiPageMetadata {
	title: string;
	description?: string;
	order?: number;
}

export interface WikiPageSummary extends WikiPageMetadata {
	id: string;
	slug: WikiSlug;
	filePath: string;
	urlPath: string;
	content: string;
	headings: WikiHeading[];
	excerpt: string;
	lastModified: string;
}

export interface WikiFolderNode {
	type: "folder";
	name: string;
	title: string;
	slug: WikiSlug;
	path: string;
	order: number;
	indexPage?: WikiPageNode | null;
	children: WikiTreeNode[];
}

export interface WikiPageNode extends WikiPageSummary {
	type: "page";
}

export type WikiTreeNode = WikiFolderNode | WikiPageNode;

export interface WikiFrontmatterParseResult {
	content: string;
	metadata: Partial<WikiPageMetadata>;
}

export interface WikiSearchDocument {
	id: string;
	title: string;
	description?: string;
	urlPath: string;
	path: string;
	snippet: string;
	matches: Array<{
		field: "title" | "description" | "content";
		text: string;
	}>;
}
