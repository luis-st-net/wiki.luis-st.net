import { Cog } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { WikiButton } from "@/components/wiki/wiki-components";

type AdminLayoutProps = {
	children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<header className="flex h-16 items-center justify-between border-b border-border/80 bg-background/95 px-6 backdrop-blur">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 text-foreground">
						<Cog className="h-5 w-5" />
						<h1 className="text-lg font-semibold tracking-tight">Wiki Admin Workspace</h1>
					</div>
					<p className="hidden text-sm text-muted-foreground sm:block">
						Manage MDX documentation with live preview editing.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<ThemeToggle />
					<WikiButton variant="outline" asChild>
						<Link href="/wiki">View Wiki</Link>
					</WikiButton>
				</div>
			</header>
			<main className="flex flex-1 overflow-hidden">{children}</main>
		</div>
	);
}
