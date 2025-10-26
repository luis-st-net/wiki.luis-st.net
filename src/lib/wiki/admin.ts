import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { ensureContentRoot } from "./content";
import { parseFrontmatter } from "./frontmatter";
import { pathToSegments } from "./slug";
import type { WikiPageMetadata } from "./types";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const MDX_EXTENSION = ".mdx";

export type AdminFileDescriptor = {
	path: string;
	name: string;
	content: string;
	metadata: Partial<WikiPageMetadata>;
	slug: string[];
};

export async function readAdminFile(relativePath: string): Promise<AdminFileDescriptor> {
	await ensureContentRoot();
	const normalized = normalizeFilePath(relativePath);
	const absolutePath = resolveContentPath(normalized);

	const fileContent = await fs.readFile(absolutePath, "utf8");
	const { content, metadata } = parseFrontmatter(fileContent);

	return {
		path: normalized,
		name: path.basename(normalized),
		content: fileContent,
		metadata,
		slug: pathToSegments(normalized.replace(new RegExp(`${MDX_EXTENSION}$`), "")),
	};
}

export async function writeAdminFile(relativePath: string, fileContent: string): Promise<void> {
	await ensureContentRoot();
	const normalized = normalizeFilePath(relativePath);
	const absolutePath = resolveContentPath(normalized);

	await fs.mkdir(path.dirname(absolutePath), { recursive: true });
	await fs.writeFile(absolutePath, fileContent, "utf8");
	await triggerRevalidation(normalized);
}

export async function deleteAdminFile(relativePath: string): Promise<void> {
	await ensureContentRoot();
	const normalized = normalizeFilePath(relativePath);
	const absolutePath = resolveContentPath(normalized);
	await fs.unlink(absolutePath);
	await triggerRevalidation(normalized);
}

export async function createAdminFolder(relativePath: string): Promise<void> {
	await ensureContentRoot();
	const normalized = normalizeDirectoryPath(relativePath);
	const absolutePath = resolveContentPath(normalized);
	await fs.mkdir(absolutePath, { recursive: true });
	await triggerRevalidation(normalized);
}

export async function deleteAdminFolder(relativePath: string): Promise<void> {
	await ensureContentRoot();
	const normalized = normalizeDirectoryPath(relativePath);
	const absolutePath = resolveContentPath(normalized);
	await fs.rm(absolutePath, { recursive: true, force: true });
	await triggerRevalidation(normalized);
}

function resolveContentPath(relativePath: string): string {
	const absolutePath = path.join(CONTENT_ROOT, relativePath);
	if (!absolutePath.startsWith(CONTENT_ROOT)) {
		throw new Error("Invalid path");
	}
	return absolutePath;
}

function normalizeFilePath(relativePath: string): string {
	const trimmed = relativePath.trim().replace(/^[\\/]+/, "");
	if (!trimmed.endsWith(MDX_EXTENSION)) {
		return `${trimmed}${MDX_EXTENSION}`;
	}
	return trimmed;
}

function normalizeDirectoryPath(relativePath: string): string {
	return relativePath.trim().replace(/^[\\/]+/, "");
}

async function triggerRevalidation(relativePath: string): Promise<void> {
	const withoutExtension = relativePath.replace(new RegExp(`${MDX_EXTENSION}$`), "");
	const wikiPath = withoutExtension ? `/wiki/${withoutExtension}`.replace(/\/+$/, "") : "/wiki";
	revalidatePath("/wiki");
	revalidatePath(wikiPath);
	revalidatePath("/admin");
	revalidatePath("/api/wiki/search");
}
