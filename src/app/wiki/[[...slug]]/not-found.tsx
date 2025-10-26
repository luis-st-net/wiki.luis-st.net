import Link from "next/link";
import { WikiButton } from "@/components/wiki/wiki-components";

export default function WikiNotFound() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
			<div className="space-y-2">
				<h2 className="text-3xl font-semibold tracking-tight">Page Not Found</h2>
				<p className="max-w-prose text-muted-foreground">
					The wiki page you requested could not be found. It may have been moved, deleted, or renamed.
				</p>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<WikiButton asChild>
					<Link href="/wiki">Back to Wiki Home</Link>
				</WikiButton>
				<WikiButton variant="outline" asChild>
					<Link href="/admin">Open Admin Panel</Link>
				</WikiButton>
			</div>
		</div>
	);
}
