import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { WikiScrollArea } from "@/components/wiki/wiki-components";
import { cn } from "@/lib/utils";
import type { WikiFolderNode, WikiPageNode, WikiTreeNode } from "@/lib/wiki/types";
import { segmentsEqual } from "@/lib/wiki/slug";

type WikiSidebarProps = {
	tree: WikiFolderNode;
	activeSlug: string[];
};

export function WikiSidebar({ tree, activeSlug }: WikiSidebarProps) {
	return (
		<nav className="flex h-full w-full flex-col">
			<div className="px-4 pb-4 pt-6">
				<h2 className="text-lg font-semibold text-foreground">{tree.title}</h2>
				<p className="text-sm text-muted-foreground">
					Structured documentation index powered by the file system.
				</p>
			</div>
			<WikiScrollArea className="flex-1 px-3 pb-8">
				<ul className="space-y-1">
					{tree.children.map((node) => (
						<li key={node.type === "page" ? node.id : node.path}>{renderNode(node, activeSlug, 0)}</li>
					))}
				</ul>
			</WikiScrollArea>
		</nav>
	);
}

function renderNode(node: WikiTreeNode, activeSlug: string[], depth: number): ReactNode {
	if (node.type === "page") {
		return <SidebarLink node={node} activeSlug={activeSlug} depth={depth} />;
	}

	const isExpanded = node.slug.every((segment, index) => activeSlug[index] === segment);
	const children = node.children.filter(
		(child) => !(child.type === "page" && segmentsEqual(child.slug, node.slug)),
	);

	const indentStyle: CSSProperties | undefined = depth ? { marginLeft: `calc(${depth} * 0.85rem)` } : undefined;
	const directChildrenCount = children.length + (node.indexPage ? 1 : 0);

	return (
		<details open={isExpanded} className="group">
			<summary
				className={cn(
					"flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted/60 group-open:bg-muted",
				)}
				style={indentStyle}
			>
				<span className="flex flex-1 items-center gap-2">
					<ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-90" />
					<span className="truncate text-foreground">{node.title}</span>
				</span>
				<span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
					{directChildrenCount} {directChildrenCount === 1 ? "item" : "items"}
				</span>
			</summary>
			<div className="mt-1 space-y-1 pl-4">
				{node.indexPage ? (
					<SidebarLink node={node.indexPage} activeSlug={activeSlug} depth={depth + 1} />
				) : null}
				{children.map((child) => (
					<div key={child.type === "page" ? child.id : child.path}>{renderNode(child, activeSlug, depth + 1)}</div>
				))}
			</div>
		</details>
	);
}

function SidebarLink({ node, activeSlug, depth }: { node: WikiPageNode; activeSlug: string[]; depth: number }) {
	const href = `/wiki${node.urlPath ? `/${node.urlPath}` : ""}`;
	const isActive =
		activeSlug.length === node.slug.length && node.slug.every((segment, index) => activeSlug[index] === segment);

	return (
		<Link
			href={href}
			className={cn(
				"group relative flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition",
				isActive
					? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40"
					: "text-muted-foreground hover:bg-muted hover:text-foreground",
			)}
			style={
				{
					marginLeft: depth ? `calc(${depth} * 0.75rem)` : undefined,
				} as CSSProperties
			}
		>
			<span className="truncate">{node.title}</span>
		</Link>
	);
}
