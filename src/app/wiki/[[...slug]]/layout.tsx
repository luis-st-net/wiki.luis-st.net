import { WikiSidebar } from "@/components/wiki/sidebar";
import type { WikiFolderNode } from "@/lib/wiki/types";
import { getWikiTree } from "@/lib/wiki/content";

type WikiContentLayoutProps = {
	children: React.ReactNode;
	params: Promise<{ slug?: string[] }>;
};

export default async function WikiContentLayout({ children, params }: WikiContentLayoutProps) {
	const resolvedParams = await params;
	const slug = resolvedParams.slug ?? [];
	const tree: WikiFolderNode = await getWikiTree();

	return (
		<>
			<aside className="hidden w-[300px] shrink-0 border-r border-border/80 bg-background/95 lg:block">
				<WikiSidebar tree={tree} activeSlug={slug} />
			</aside>
			<div className="flex flex-1 justify-center overflow-y-auto bg-background">
				<div className="flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:items-start">
					<div className="min-w-0 flex-1">{children}</div>
				</div>
			</div>
		</>
	);
}
