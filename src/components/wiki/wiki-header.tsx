import Link from "next/link";
import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { WikiButton, WikiSeparator } from "@/components/wiki/wiki-components";
import { WikiSearchDialog } from "@/components/wiki/search-dialog";

export function WikiHeader() {
	return (
		<header className="fixed inset-x-0 top-0 z-[200] flex h-16 w-full items-center justify-between border-b border-border/80 bg-[hsl(var(--background))] px-5 text-foreground shadow-md">
			<div className="flex items-center gap-3">
				<Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
					Wiki Workspace
				</Link>
				<WikiSeparator className="hidden h-6 lg:block" />
				<p className="hidden text-sm text-muted-foreground lg:block">
					Document GitHub projects with a file-backed, MDX-powered knowledge base.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<div className="w-44 sm:w-56 lg:w-72">
					<WikiSearchDialog />
				</div>
				<ThemeToggle />
				<WikiButton variant="outline" asChild>
					<Link href="/admin">Admin Panel</Link>
				</WikiButton>
				<WikiButton size="icon" variant="ghost" asChild>
					<a href="https://github.com" target="_blank" rel="noreferrer" aria-label="View on GitHub">
						<Github className="h-5 w-5" />
					</a>
				</WikiButton>
			</div>
		</header>
	);
}
