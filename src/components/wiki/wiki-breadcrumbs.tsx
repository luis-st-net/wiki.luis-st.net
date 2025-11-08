import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Breadcrumb } from "@/lib/wiki/navigation";
import { cn } from "@/lib/utils";

export function WikiBreadcrumbs({ items, className }: { items: Breadcrumb[]; className?: string }) {
	return (
		<nav aria-label="Breadcrumb">
			<ol className={cn("flex flex-wrap items-center gap-1 text-sm text-muted-foreground", className)}>
				{items.map((item, index) => {
					const href = `/wiki${item.urlPath ? `/${item.urlPath}` : ""}`;
					const isLast = index === items.length - 1;

					const key = `${item.type}:${href}`;

					return (
						<li key={key} className="flex items-center gap-1">
							{isLast ? (
								<span className="font-medium text-foreground">{item.title}</span>
							) : (
								<Link href={href} className="hover:text-primary">
									{item.title}
								</Link>
							)}
							{!isLast ? <ChevronRight className="h-4 w-4 text-border" /> : null}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
