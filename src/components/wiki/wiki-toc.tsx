"use client";

import { useEffect, useMemo, useState } from "react";
import { WikiHeading } from "@/lib/wiki/types";
import { cn } from "@/lib/utils";

type WikiTableOfContentsProps = {
	headings: WikiHeading[];
};

export function WikiTableOfContents({ headings }: WikiTableOfContentsProps) {
	const [activeId, setActiveId] = useState<string | null>(null);

	const trackedHeadingIds = useMemo(() => headings.map((heading) => heading.id), [headings]);

	useEffect(() => {
		if (trackedHeadingIds.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const visible = entries
					.filter((entry) => entry.isIntersecting)
					.sort((a, b) => b.intersectionRatio - a.intersectionRatio);

				if (visible.length > 0) {
					setActiveId(visible[0].target.id);
				}
			},
			{
				rootMargin: "0px 0px -70% 0px",
				threshold: [0, 0.25, 0.5, 1],
			},
		);

		trackedHeadingIds.forEach((id) => {
			const element = document.getElementById(id);
			if (element) {
				observer.observe(element);
			}
		});

		return () => observer.disconnect();
	}, [trackedHeadingIds]);

	if (headings.length === 0) {
		return null;
	}

	return (
		<aside className="sticky top-24 hidden w-64 shrink-0 lg:block">
			<div className="rounded-xl border border-border/70 bg-background/80 p-4">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>
				<nav className="mt-3 space-y-1 text-sm">
					{headings.map((heading) => (
						<a
							key={heading.id}
							href={`#${heading.id}`}
							className={cn(
								"block rounded-md px-2 py-1 text-muted-foreground transition hover:text-foreground",
								activeId === heading.id && "bg-secondary text-foreground",
							)}
							style={{
								marginLeft: (heading.level - 1) * 12,
							}}
						>
							{heading.text}
						</a>
					))}
				</nav>
			</div>
		</aside>
	);
}
