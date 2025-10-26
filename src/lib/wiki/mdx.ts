import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import "prismjs";
import type { MDXComponents } from "mdx/types";

import "prismjs/components/prism-bash";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";

type CompileResult<TFrontmatter extends Record<string, unknown>> = Awaited<
	ReturnType<typeof compileMDX<TFrontmatter>>
>;

export async function compileWikiMdx<TFrontmatter extends Record<string, unknown> = Record<string, never>>(
	source: string,
	components?: MDXComponents,
): Promise<CompileResult<TFrontmatter>> {
	return compileMDX<TFrontmatter>({
		source,
		components,
		options: {
			parseFrontmatter: false,
			mdxOptions: {
				remarkPlugins: [remarkGfm],
				rehypePlugins: [
					rehypeSlug,
					[
						rehypeAutolinkHeadings,
						{
							behavior: "append",
							properties: {
								className: ["wiki-heading-anchor"],
								"aria-label": "Anchor",
							},
						},
					],
					rehypePrismPlus,
				],
			},
		},
	});
}
