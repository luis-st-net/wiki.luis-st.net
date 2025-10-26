import { NextResponse } from "next/server";
import { wikiMdxComponents } from "@/components/wiki/mdx-components";
import { compileWikiMdx } from "@/lib/wiki/mdx";
import { parseFrontmatter } from "@/lib/wiki/frontmatter";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { content?: string };
		if (typeof body.content !== "string") {
			return NextResponse.json({ error: "Missing content" }, { status: 400 });
		}

		const { content } = parseFrontmatter(body.content);
		const { renderToStaticMarkup } = await import("react-dom/server");
		const { content: renderedContent } = await compileWikiMdx(content, wikiMdxComponents);
		const html = renderToStaticMarkup(renderedContent);
		return NextResponse.json({ html });
	} catch (error) {
		console.error("Failed to build preview", error);
		return NextResponse.json({ error: "Unable to render preview" }, { status: 500 });
	}
}
