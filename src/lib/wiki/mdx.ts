import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrismPlus from "rehype-prism-plus";
import Prism from "prismjs";
import type { MDXComponents } from "mdx/types";
import type { ElementContent } from "hast";

import "prismjs/components/prism-bash";
import "prismjs/components/prism-diff";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markup-templating";

const headingAnchorContent = [
	{
		type: "element",
		tagName: "span",
		properties: {
			className: ["sr-only"],
		},
		children: [
			{
				type: "text",
				value: "Jump to this heading",
			},
		],
	},
] satisfies ElementContent[];

if (!Prism.languages.mdx && Prism.languages.jsx) {
	Prism.languages.mdx = Prism.languages.jsx;
}

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
							content: headingAnchorContent,
						},
					],
					rehypePrismPlus,
				],
			},
		},
	});
}
