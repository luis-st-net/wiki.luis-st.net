import { CalendarClock, FileText } from "lucide-react";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiBadge, WikiPanel, WikiSeparator } from "@/components/wiki/wiki-components";
import type { Breadcrumb } from "@/lib/wiki/navigation";
import type { WikiPageNode } from "@/lib/wiki/types";

type WikiPageContainerProps = {
	page: WikiPageNode;
	breadcrumbs: Breadcrumb[];
	children: React.ReactNode;
};

export function WikiPageContainer({ page, breadcrumbs, children }: WikiPageContainerProps) {
	return (
		<div className="space-y-6">
			<WikiBreadcrumbs items={breadcrumbs} />
			<header className="space-y-4 rounded-2xl border border-border/70 bg-background/90 p-6 shadow-sm">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{page.title}</h1>
						{page.description ? (
							<p className="max-w-2xl text-muted-foreground">{page.description}</p>
						) : null}
					</div>
					<WikiBadge variant="outline" className="flex items-center gap-2 text-xs uppercase tracking-wide">
						<FileText className="h-3.5 w-3.5" />
						MDX Page
					</WikiBadge>
				</div>
				<WikiSeparator />
				<div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
					<span className="inline-flex items-center gap-2">
						<CalendarClock className="h-4 w-4" />
						Last updated {formatDate(page.lastModified)}
					</span>
					<span className="inline-flex items-center gap-2">
						<FileText className="h-4 w-4" />
						{page.headings.length} sections
					</span>
				</div>
			</header>
			<WikiPanel padding="p-0" className="overflow-hidden">
				<article className="wiki-prose prose mx-auto w-full max-w-5xl px-8 py-10">{children}</article>
			</WikiPanel>
		</div>
	);
}

function formatDate(input: string): string {
	try {
		const date = new Date(input);
		return new Intl.DateTimeFormat("en", {
			year: "numeric",
			month: "short",
			day: "numeric",
		}).format(date);
	} catch {
		return input;
	}
}
