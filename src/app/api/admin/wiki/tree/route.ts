import { NextResponse } from "next/server";
import { getWikiTree } from "@/lib/wiki/content";
import { toAdminTree } from "@/lib/wiki/admin-tree";

export async function GET() {
	try {
		const tree = await getWikiTree();
		const payload = toAdminTree(tree);
		return NextResponse.json({ tree: payload });
	} catch (error) {
		console.error("Failed to load wiki tree", error);
		return NextResponse.json({ error: "Unable to load tree" }, { status: 500 });
	}
}
