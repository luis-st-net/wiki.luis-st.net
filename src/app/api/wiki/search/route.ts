import { NextResponse } from "next/server";
import { searchWiki } from "@/lib/wiki/search";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const query = searchParams.get("q") ?? "";

	try {
		const results = await searchWiki(query);
		return NextResponse.json({ results });
	} catch (error) {
		console.error("Search error", error);
		return NextResponse.json({ results: [], error: "Unable to perform search" }, { status: 500 });
	}
}
