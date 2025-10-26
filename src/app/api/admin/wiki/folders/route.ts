import { NextResponse } from "next/server";
import { createAdminFolder, deleteAdminFolder } from "@/lib/wiki/admin";

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as { path?: string };
		if (!body.path) {
			return NextResponse.json({ error: "Missing path" }, { status: 400 });
		}

		await createAdminFolder(body.path);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to create folder", error);
		return NextResponse.json({ error: "Unable to create folder" }, { status: 500 });
	}
}

export async function DELETE(request: Request) {
	try {
		const body = (await request.json()) as { path?: string };
		if (!body.path) {
			return NextResponse.json({ error: "Missing path" }, { status: 400 });
		}

		await deleteAdminFolder(body.path);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete folder", error);
		return NextResponse.json({ error: "Unable to delete folder" }, { status: 500 });
	}
}
