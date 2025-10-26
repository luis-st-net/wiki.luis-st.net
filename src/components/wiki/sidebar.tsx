import Link from "next/link";
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
			<WikiScrollArea className="flex-1 px-2 pb-8">
				<ul className="space-y-2 pr-2">
					{tree.children.map((node) => (
						<li key={node.type === "page" ? node.id : node.path}>{renderNode(node, activeSlug, 0)}</li>
					))}
				</ul>
			</WikiScrollArea>
		</nav>
	);
}

function renderNode(node: WikiTreeNode, activeSlug: string[], depth: number): React.ReactNode {
	if (node.type === "page") {
		return <SidebarLink node={node} activeSlug={activeSlug} depth={depth} />;
	}

	const isExpanded = node.slug.every((segment, index) => activeSlug[index] === segment);
	const children = node.children.filter(
		(child) => !(child.type === "page" && segmentsEqual(child.slug, node.slug)),
	);

	return (
		<details open={isExpanded} className="group rounded-lg border border-transparent transition hover:border-border/60">
			<summary
				className={cn(
					"flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary",
					depth > 0 && "ml-[calc(var(--indent))]",
				)}
				style={
					{
						"--indent": `${depth * 0.75}rem`,
					} as React.CSSProperties
				}
			>
				<span>{node.title}</span>
				<span className="text-xs text-muted-foreground">{children.length}</span>
			</summary>
			<div className="mt-2 space-y-1">
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
				"group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition",
				isActive
					? "bg-primary/10 text-primary border border-primary/30 shadow-sm"
					: "text-muted-foreground hover:bg-secondary hover:text-foreground",
			)}
			style={
				{
					marginLeft: depth ? `calc(${depth} * 0.75rem)` : undefined,
				} as React.CSSProperties
			}
		>
			<span className="truncate">{node.title}</span>
			{node.headings.length ? (
				<span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">#{node.headings.length}</span>
			) : null}
		</Link>
	);
}
