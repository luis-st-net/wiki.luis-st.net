import { Suspense } from "react";
import { AdminWorkspace } from "@/components/admin/admin-workspace";
import { toAdminTree } from "@/lib/wiki/admin-tree";
import { readAdminFile } from "@/lib/wiki/admin";
import { getWikiTree } from "@/lib/wiki/content";

export default async function AdminPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined> | undefined>;
}) {
	const resolvedSearchParams = await searchParams;
	const tree = await getWikiTree();
	const adminTree = toAdminTree(tree);
	const requestedPath = resolvedSearchParams?.path;
	const normalizedPath = Array.isArray(requestedPath) ? requestedPath[0] : requestedPath;
	const initialPath = normalizedPath ?? adminTree.index?.relativePath ?? "index.mdx";

	let initialFile = null;
	try {
		initialFile = await readAdminFile(initialPath);
	} catch (error) {
		console.warn("Unable to load initial file", error);
	}

	return (
		<Suspense fallback={<div className="flex flex-1 items-center justify-center">Loading admin workspace…</div>}>
			<AdminWorkspace initialTree={adminTree} initialFile={initialFile} />
		</Suspense>
	);
}
