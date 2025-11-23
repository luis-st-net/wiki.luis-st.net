import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

const baseHeading =
	"scroll-mt-28 font-semibold tracking-tight text-foreground [&:not(:first-child)]:mt-12";

const headingSizes: Record<number, string> = {
	1: "text-4xl md:text-5xl",
	2: "text-3xl md:text-4xl",
	3: "text-2xl md:text-3xl",
	4: "text-xl md:text-2xl",
	5: "text-lg md:text-xl",
	6: "text-base md:text-lg uppercase tracking-wide text-muted-foreground",
};

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
	const Component = `h${level}` as const;
	return ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
		<Component className={cn(baseHeading, headingSizes[level], className)} {...props} />
	);
}

function Paragraph({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return <p className={cn("leading-7 text-muted-foreground [&:not(:first-child)]:mt-6", className)} {...props} />;
}

function Anchor({ className, href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	const isInternal = typeof href === "string" && href.startsWith("/");
	const sharedClassName = cn("font-medium text-primary underline-offset-4 hover:underline", className);

	if (isInternal && typeof href === "string") {
		return (
			<Link href={href} className={sharedClassName} {...props}>
				{children}
			</Link>
		);
	}

	return (
		<a href={href} className={sharedClassName} {...props}>
			{children}
		</a>
	);
}

function List({
	className,
	ordered,
	...props
}: React.HTMLAttributes<HTMLUListElement | HTMLOListElement> & { ordered?: boolean }) {
	const Comp = ordered ? "ol" : "ul";
	return (
		<Comp
			className={cn(
				"my-6 ml-6 space-y-2 text-muted-foreground",
				ordered ? "list-decimal" : "list-disc",
				className,
			)}
			{...props}
		/>
	);
}

function Pre({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) {
	return <pre className={cn("my-6 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4", className)} {...props} />;
}

function Code({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
	const isInline = !className || !className.includes("language-");

	if (isInline) {
		return (
			<code
				className={cn("inline-flex items-center gap-1 rounded-md border bg-transparent text-sm font-semibold", className)}
				{...props}
			>
				{children}
			</code>
		);
	}

	return (
		<code
			className={cn("block font-mono text-sm leading-6", className)}
			{...props}
		>
			{children}
		</code>
	);
}

function Blockquote({ className, ...props }: React.HTMLAttributes<HTMLQuoteElement>) {
	return (
		<blockquote
			className={cn(
				"my-6 border-l-4 border-primary/60 bg-primary/5 px-5 py-3 text-base italic leading-relaxed text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

function InlineImage({
	className,
	alt,
	...props
}: React.ComponentProps<typeof Image> & { className?: string }) {
	return (
		<div className="my-6 overflow-hidden rounded-lg border border-border">
			<Image alt={alt} className={cn("h-auto w-full", className)} {...props} />
			{alt ? <p className="bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{alt}</p> : null}
		</div>
	);
}

function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
	return (
		<div className="my-6 overflow-hidden rounded-lg border border-border">
			<table className={cn("w-full border-collapse text-sm", className)} {...props} />
		</div>
	);
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
	return (
		<tr
			className={cn("border-b border-border/60 even:bg-muted/30 [&>td]:px-3 [&>td]:py-2 [&>th]:px-3 [&>th]:py-2", className)}
			{...props}
		/>
	);
}

function TableHeader({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
	return (
		<th className={cn("bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)} {...props} />
	);
}

function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
	return <td className={cn("align-top text-muted-foreground", className)} {...props} />;
}

function Callout({
	type = "info",
	title,
	children,
}: {
	type?: "info" | "warning" | "success" | "danger";
	title?: string;
	children: React.ReactNode;
}) {
	const palette: Record<typeof type, string> = {
		info: "border-blue-400 bg-blue-500/10 text-blue-900 dark:text-blue-100",
		warning: "border-orange-400 bg-orange-500/10 text-orange-900 dark:text-orange-100",
		success: "border-emerald-400 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100",
		danger: "border-red-400 bg-red-500/10 text-red-900 dark:text-red-100",
	};

	return (
		<div className={cn("my-6 rounded-lg border p-4 text-sm leading-relaxed", palette[type])}>
			{title ? <p className="mb-1 font-semibold">{title}</p> : null}
			<div className="space-y-2 text-foreground">{children}</div>
		</div>
	);
}

export const wikiMdxComponents: MDXComponents = {
	h1: createHeading(1),
	h2: createHeading(2),
	h3: createHeading(3),
	h4: createHeading(4),
	h5: createHeading(5),
	h6: createHeading(6),
	p: Paragraph,
	a: Anchor,
	ul: (props) => <List {...props} />,
	ol: (props) => <List {...props} ordered />,
	pre: Pre,
	code: Code,
	blockquote: Blockquote,
	img: InlineImage as unknown as MDXComponents["img"],
	table: Table,
	tr: TableRow,
	th: TableHeader,
	td: TableCell,
	Callout,
};
