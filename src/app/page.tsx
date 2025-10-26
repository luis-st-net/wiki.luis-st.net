import Link from "next/link";

export default function HomePage() {
	return (
		<main className="flex h-screen flex-col items-center justify-center gap-6 px-6 text-center">
			<div className="space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
					Project Wiki Workspace
				</h1>
				<p className="text-muted-foreground max-w-prose">
					Use the sidebar navigation to explore documentation pages or head to
					the admin panel to manage MDX-based content for your GitHub projects.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-4">
				<Link
					href="/wiki"
					className="rounded-md border border-border bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90"
				>
					Open Wiki
				</Link>
				<Link
					href="/admin"
					className="rounded-md border border-border px-5 py-2 text-sm font-medium text-foreground transition hover:bg-secondary"
				>
					Open Admin Panel
				</Link>
			</div>
		</main>
	);
}
