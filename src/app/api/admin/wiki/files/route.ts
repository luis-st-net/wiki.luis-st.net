import { NextResponse } from "next/server";
import { deleteAdminFile, readAdminFile, writeAdminFile } from "@/lib/wiki/admin";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const path = searchParams.get("path");

	if (!path) {
		return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
	}

	try {
		const file = await readAdminFile(path);
		return NextResponse.json({ file });
	} catch (error) {
		console.error("Failed to read file", error);
		return NextResponse.json({ error: "Unable to read file" }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { path?: string; content?: string };
		if (!body.path || typeof body.content !== "string") {
			return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
		}

		await writeAdminFile(body.path, body.content);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to save file", error);
		return NextResponse.json({ error: "Unable to save file" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const body = (await request.json()) as { path?: string };
		if (!body.path) {
			return NextResponse.json({ error: "Missing path" }, { status: 400 });
		}

		await deleteAdminFile(body.path);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete file", error);
		return NextResponse.json({ error: "Unable to delete file" }, { status: 500 });
	}
}
