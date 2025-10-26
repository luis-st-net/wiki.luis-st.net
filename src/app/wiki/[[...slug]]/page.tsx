import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { wikiMdxComponents } from "@/components/wiki/mdx-components";
import { WikiPageContainer } from "@/components/wiki/wiki-page";
import { WikiTableOfContents } from "@/components/wiki/wiki-toc";
import { compileWikiMdx } from "@/lib/wiki/mdx";
import { getBreadcrumbsForSlug } from "@/lib/wiki/navigation";
import { getWikiPage } from "@/lib/wiki/content";

type WikiPageProps = {
	params: { slug?: string[] };
};

export async function generateMetadata({ params }: WikiPageProps): Promise<Metadata> {
	const slug = params.slug ?? [];
	const page = await getWikiPage(slug);

	if (!page) {
		return {
			title: "Page Not Found — Project Wiki",
			description: "The requested wiki page could not be located.",
		};
	}

	return {
		title: `${page.title} — Project Wiki`,
		description: page.description,
	};
}

export default async function WikiPage({ params }: WikiPageProps) {
	const slug = params.slug ?? [];
	const page = await getWikiPage(slug);

	if (!page) {
		notFound();
	}

	const breadcrumbs = await getBreadcrumbsForSlug(page.slug);
	const { content } = await compileWikiMdx(page.content, wikiMdxComponents);

	return (
		<>
			<WikiPageContainer page={page} breadcrumbs={breadcrumbs}>
				{content}
			</WikiPageContainer>
			<WikiTableOfContents headings={page.headings} />
		</>
	);
}
