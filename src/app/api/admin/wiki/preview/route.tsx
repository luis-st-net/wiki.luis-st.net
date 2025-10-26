import { NextResponse } from "next/server";
import type { MDXComponents } from "mdx/types";
import { wikiMdxComponents } from "@/components/wiki/mdx-components";
import { compileWikiMdx } from "@/lib/wiki/mdx";
import { parseFrontmatter } from "@/lib/wiki/frontmatter";
import { cn } from "@/lib/utils";

const previewMdxComponents: MDXComponents = {
	...wikiMdxComponents,
	a: ({ className, children, ...props }) => (
		<a className={cn("font-medium text-primary underline-offset-4 hover:underline", className)} {...props}>
			{children}
		</a>
	),
	img: ({ className, alt, ...props }) => (
		<div className="my-6 overflow-hidden rounded-lg border border-border">
			<img alt={alt ?? ""} className={cn("h-auto w-full", className)} {...props} />
			{alt ? <p className="bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{alt}</p> : null}
		</div>
	),
};

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { content?: string };
		if (typeof body.content !== "string") {
			return NextResponse.json({ error: "Missing content" }, { status: 400 });
		}

		const { content } = parseFrontmatter(body.content);
		const { renderToStaticMarkup } = await import("react-dom/server");
		const { content: renderedContent } = await compileWikiMdx(content, previewMdxComponents);
		const html = renderToStaticMarkup(renderedContent);
		return NextResponse.json({ html });
	} catch (error) {
		console.error("Failed to build preview", error);
		return NextResponse.json({ error: "Unable to render preview" }, { status: 500 });
	}
}
