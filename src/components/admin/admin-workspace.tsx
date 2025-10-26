'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { File, Folder, Loader2, Save, Trash2 } from "lucide-react";
import type { AdminTreeNode } from "@/lib/wiki/admin-tree";
import type { AdminFileDescriptor } from "@/lib/wiki/admin";
import { WikiBadge, WikiButton, WikiInput, WikiScrollArea, WikiTabs, WikiTabsContent, WikiTabsList, WikiTabsTrigger, WikiTextarea } from "@/components/wiki/wiki-components";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PREVIEW_DEBOUNCE = 350;
const DEFAULT_FILE_CONTENT = `---\ntitle: New Wiki Page\ndescription: Provide a short summary.\norder: 999\n---\n\n## Welcome\n\nStart documenting your project here.`;

type AdminWorkspaceProps = {
	initialTree: AdminTreeNode;
	initialFile: AdminFileDescriptor | null;
};

type FolderOption = { value: string; label: string };

type DraftState = {
	path: string;
	content: string;
};

export function AdminWorkspace({ initialTree, initialFile }: AdminWorkspaceProps) {
	const defaultPath = initialFile?.path ?? initialTree.index?.relativePath ?? null;
	const defaultContent = initialFile?.content ?? DEFAULT_FILE_CONTENT;

	const [tree, setTree] = useState<AdminTreeNode>(initialTree);
	const [selectedPath, setSelectedPath] = useState<string | null>(defaultPath);
	const [draft, setDraft] = useState<DraftState>({
		path: defaultPath ?? "",
		content: defaultContent,
	});
	const [previewHtml, setPreviewHtml] = useState<string>("");
	const [statusMessage, setStatusMessage] = useState<string>("");
	const [expanded, setExpanded] = useState<Set<string>>(() => new Set(getDefaultExpandedPaths(initialTree, defaultPath ?? "")));
	const [isSaving, setIsSaving] = useState(false);
	const [isLoadingFile, setIsLoadingFile] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<"page" | "folder" | null>(null);
	const [isDirty, setIsDirty] = useState(false);
	const previewTimeout = useRef<NodeJS.Timeout | null>(null);

	const folderOptions = useMemo(() => flattenFolders(tree), [tree]);

	useEffect(() => {
		if (!draft.content) return;

		if (previewTimeout.current) {
			clearTimeout(previewTimeout.current);
		}

		previewTimeout.current = setTimeout(() => {
			generatePreview(draft.content).then(setPreviewHtml).catch((error) => {
				console.error("Preview failed", error);
				setPreviewHtml('<p class="text-sm text-red-500">Failed to render preview.</p>');
			});
		}, PREVIEW_DEBOUNCE);

		return () => {
			if (previewTimeout.current) {
				clearTimeout(previewTimeout.current);
			}
		};
	}, [draft.content]);

	async function refreshTree() {
		try {
			const response = await fetch("/api/admin/wiki/tree");
			if (!response.ok) throw new Error("Failed to refresh tree");
			const data = (await response.json()) as { tree: AdminTreeNode };
			setTree(data.tree);
		} catch (error) {
			console.error("Unable to refresh tree", error);
		}
	}

	async function handleSelect(path: string | null) {
		if (!path) return;

		if (isDirty) {
			const confirmLeave = window.confirm("You have unsaved changes. Discard them?");
			if (!confirmLeave) return;
		}

		setIsLoadingFile(true);
		try {
			const response = await fetch(`/api/admin/wiki/files?path=${encodeURIComponent(path)}`);
			if (!response.ok) throw new Error("Failed to load file");
			const data = (await response.json()) as { file: AdminFileDescriptor };
			setDraft({ path: data.file.path, content: data.file.content });
			setSelectedPath(data.file.path);
			setExpanded((prev) => {
				const next = new Set(prev);
				for (const key of getFolderKeysForFile(data.file.path)) {
					next.add(key);
				}
				return next;
			});
			setIsDirty(false);
			setStatusMessage("");
		} catch (error) {
			console.error("Unable to load file", error);
			setStatusMessage("Failed to load file");
		} finally {
			setIsLoadingFile(false);
		}
	}

	async function handleSave() {
		if (!draft.path) return;
		setIsSaving(true);
		try {
			const response = await fetch("/api/admin/wiki/files", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: draft.path, content: draft.content }),
			});
			if (!response.ok) throw new Error("Unable to save file");
			setStatusMessage("Changes saved successfully");
			setIsDirty(false);
			await refreshTree();
		} catch (error) {
			console.error("Save failed", error);
			setStatusMessage("Failed to save file");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleDelete() {
		if (!draft.path) return;
		if (!window.confirm(`Delete ${draft.path}? This action cannot be undone.`)) return;

		setIsDeleting(true);
		try {
			const response = await fetch("/api/admin/wiki/files", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: draft.path }),
			});
			if (!response.ok) throw new Error("Unable to delete file");
			setStatusMessage("File deleted");
			await refreshTree();
			setDraft({ path: "", content: DEFAULT_FILE_CONTENT });
			setSelectedPath(null);
		} catch (error) {
			console.error("Delete failed", error);
			setStatusMessage("Failed to delete file");
		} finally {
			setIsDeleting(false);
		}
	}

	function updateDraftContent(value: string) {
		setDraft((previous) => ({ ...previous, content: value }));
		setIsDirty(true);
	}

	function toggleFolder(path: string) {
		setExpanded((previous) => {
			const next = new Set(previous);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	}

	async function handleCreateEntry(type: "page" | "folder", values: { parent: string; name: string }) {
		const parentPath = values.parent === "root" ? "" : values.parent;
		const normalizedName = values.name.trim().replace(/\s+/g, "-").toLowerCase();

		if (!normalizedName) {
			setStatusMessage("Name is required");
			return;
		}

		try {
			if (type === "folder") {
				const fullPath = [parentPath, normalizedName].filter(Boolean).join("/");
				await fetchJSON("/api/admin/wiki/folders", { path: fullPath }, "POST");
				setExpanded((previous) => {
					const next = new Set(previous);
					next.add(fullPath);
					return next;
				});
			} else {
				const folderPath = parentPath;
				const filePath = [folderPath, normalizedName].filter(Boolean).join("/");
				await fetchJSON("/api/admin/wiki/files", { path: filePath, content: DEFAULT_FILE_CONTENT }, "POST");
				if (folderPath) {
					setExpanded((previous) => {
						const next = new Set(previous);
						next.add(folderPath);
						return next;
					});
				}
				await handleSelect(`${filePath}.mdx`);
			}
			await refreshTree();
			setIsCreateDialogOpen(null);
		} catch (error) {
			console.error("Failed to create entry", error);
			setStatusMessage("Failed to create new entry");
		}
	}

	async function handleDeleteFolder(path: string) {
		try {
			await fetchJSON("/api/admin/wiki/folders", { path }, "DELETE");
			setExpanded((previous) => {
				const next = new Set(previous);
				next.delete(path);
				return next;
			});
			await refreshTree();
			setStatusMessage("Folder removed");
		} catch (error) {
			console.error("Unable to delete folder", error);
			setStatusMessage("Failed to delete folder");
		}
	}

	return (
		<div className="flex h-full w-full">
			<aside className="hidden w-80 shrink-0 border-r border-border/70 bg-background/95 md:flex md:flex-col">
				<div className="flex items-center justify-between px-4 pb-3 pt-4">
					<div>
						<h2 className="text-sm font-semibold text-muted-foreground">Content Structure</h2>
						<p className="text-xs text-muted-foreground">Folders represent hierarchy; MDX files represent pages.</p>
					</div>
				</div>
				<div className="flex items-center gap-2 px-4 pb-4">
					<WikiButton size="sm" onClick={() => setIsCreateDialogOpen("page")}>New Page</WikiButton>
					<WikiButton size="sm" variant="outline" onClick={() => setIsCreateDialogOpen("folder")}>
						New Folder
					</WikiButton>
				</div>
				<WikiScrollArea className="flex-1 px-2 pb-6">
					<div className="space-y-1 pr-2 text-sm">
						<AdminTreeView
							node={tree}
							expanded={expanded}
							onToggle={toggleFolder}
							onSelect={handleSelect}
							onDeleteFolder={handleDeleteFolder}
							selectedPath={selectedPath}
						/>
					</div>
				</WikiScrollArea>
			</aside>
			<section className="flex flex-1 flex-col overflow-hidden">
				<div className="flex items-center justify-between border-b border-border/70 px-6 py-4">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Editing</p>
						<p className="text-sm font-medium text-foreground">{draft.path || "Select or create a page"}</p>
					</div>
					<div className="flex items-center gap-2">
						{statusMessage ? <WikiBadge variant="outline">{statusMessage}</WikiBadge> : null}
						<WikiButton
							variant="outline"
							size="sm"
							disabled={!draft.path || isDeleting || isSaving}
							onClick={handleDelete}
						>
							{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
						</WikiButton>
						<WikiButton size="sm" onClick={handleSave} disabled={isSaving || !isDirty || !draft.path}>
							{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
						</WikiButton>
					</div>
				</div>
				<div className="flex flex-1 flex-col overflow-hidden">
					<WikiTabs defaultValue="editor" className="flex h-full flex-col">
						<WikiTabsList>
							<WikiTabsTrigger value="editor">Markdown</WikiTabsTrigger>
							<WikiTabsTrigger value="preview">Preview</WikiTabsTrigger>
						</WikiTabsList>
						<WikiTabsContent value="editor" className="flex-1 bg-background">
							{isLoadingFile ? (
								<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
									Loading content…
								</div>
							) : (
								<WikiTextarea
									value={draft.content}
									onChange={(event) => updateDraftContent(event.target.value)}
									className="h-full min-h-[500px] w-full resize-none"
								/>
							)}
						</WikiTabsContent>
					<WikiTabsContent value="preview" className="flex-1 overflow-y-auto bg-background">
						<div
							className="wiki-prose mx-auto w-full max-w-4xl px-6 py-6"
							dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-sm text-muted-foreground">Preview will appear here.</p>' }}
						/>
						</WikiTabsContent>
					</WikiTabs>
				</div>
			</section>

			<CreateEntryDialog
				type={isCreateDialogOpen}
				onClose={() => setIsCreateDialogOpen(null)}
				onSubmit={handleCreateEntry}
				folderOptions={folderOptions}
			/>
		</div>
	);
}

type AdminTreeViewProps = {
	node: AdminTreeNode;
	expanded: Set<string>;
	onToggle: (path: string) => void;
	onSelect: (path: string | null) => void;
	onDeleteFolder: (path: string) => void;
	selectedPath: string | null;
	depth?: number;
};

function AdminTreeView({ node, expanded, onToggle, onSelect, onDeleteFolder, selectedPath, depth = 0 }: AdminTreeViewProps) {
	if (node.type === "folder" && depth === 0) {
		return (
			<div className="space-y-1">
				{node.index ? (
					<AdminTreeView
						node={node.index}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						selectedPath={selectedPath}
						depth={depth + 1}
					/>
				) : null}
				{node.children?.map((child) => (
					<AdminTreeView
						key={`${child.type}-${child.path}-${child.relativePath ?? ""}`}
						node={child}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						selectedPath={selectedPath}
						depth={depth + 1}
					/>
				))}
			</div>
		);
	}

	if (node.type === "page") {
		const isActive = selectedPath === node.relativePath;
		return (
			<button
				type="button"
				onClick={() => onSelect(node.relativePath ?? null)}
				className={cn(
					"flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition",
					isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
				)}
				style={{ marginLeft: depth * 14 }}
			>
				<File className="h-3.5 w-3.5" />
				<span className="truncate text-sm">{node.title}</span>
			</button>
		);
	}

	const isExpanded = expanded.has(node.path);

	return (
		<div>
			<div
				className="flex w-full items-center gap-2"
				style={{ marginLeft: depth * 14 }}
			>
				<button
					type="button"
					onClick={() => onToggle(node.path)}
					className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-secondary"
				>
					<Folder className="h-3.5 w-3.5" />
					<span className="truncate">{node.title}</span>
				</button>
				{depth > 0 ? (
					<button
						type="button"
						onClick={(event) => {
							event.stopPropagation();
							if (window.confirm(`Delete folder ${node.path}? This will remove all nested content.`)) {
								onDeleteFolder(node.path);
							}
						}}
						className="rounded-md p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				) : null}
			</div>
			{isExpanded ? (
				<div className="mt-1 space-y-1">
					{node.index ? (
						<AdminTreeView
							node={node.index}
							expanded={expanded}
							onToggle={onToggle}
							onSelect={onSelect}
							onDeleteFolder={onDeleteFolder}
							selectedPath={selectedPath}
							depth={depth + 1}
						/>
					) : null}
					{node.children?.map((child) => (
						<AdminTreeView
							key={`${child.type}-${child.path}-${child.relativePath ?? ""}`}
							node={child}
							expanded={expanded}
							onToggle={onToggle}
							onSelect={onSelect}
							onDeleteFolder={onDeleteFolder}
							selectedPath={selectedPath}
							depth={depth + 1}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}

type CreateEntryDialogProps = {
	type: "page" | "folder" | null;
	onClose: () => void;
	onSubmit: (type: "page" | "folder", values: { parent: string; name: string }) => void;
	folderOptions: FolderOption[];
};

function CreateEntryDialog({ type, onClose, onSubmit, folderOptions }: CreateEntryDialogProps) {
	const [name, setName] = useState("");
	const [parent, setParent] = useState<string>("root");

	useEffect(() => {
		if (type) {
			setName("");
			setParent("root");
		}
	}, [type]);

	if (!type) return null;

	const title = type === "page" ? "Create New Page" : "Create New Folder";
	const description =
		type === "page"
			? "Create a new MDX page. The file will be stored under the selected folder."
			: "Create a new folder to organize your documentation hierarchy.";

	return (
		<Dialog open onOpenChange={() => onClose()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1">
						<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Parent Folder</label>
						<select
							value={parent}
							onChange={(event) => setParent(event.target.value)}
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							<option value="root">Root</option>
							{folderOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
					<div className="space-y-1">
						<label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</label>
						<WikiInput value={name} onChange={(event) => setName(event.target.value)} placeholder="my-new-page" />
						<p className="text-xs text-muted-foreground">
							Use lowercase letters, numbers, or hyphens. The `.mdx` extension will be added automatically.
						</p>
					</div>
				</div>
				<DialogFooter className="mt-6">
					<WikiButton variant="outline" onClick={onClose} type="button">
						Cancel
					</WikiButton>
					<WikiButton
						onClick={() => onSubmit(type, { parent, name })}
						type="button"
					>
						Create
					</WikiButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function flattenFolders(tree: AdminTreeNode): FolderOption[] {
	const folders: FolderOption[] = [];

	function traverse(node: AdminTreeNode, trail: string[]) {
		if (node.type === "folder") {
			const label = trail.length ? [...trail, node.title].join(" / ") : node.title;
			if (node.path) {
				folders.push({ value: node.path, label });
			}
			for (const child of node.children ?? []) {
				traverse(child, [...trail, node.title]);
			}
		}
	}

	traverse(tree, []);

	return folders;
}

function getDefaultExpandedPaths(tree: AdminTreeNode, targetPath: string): string[] {
	const paths: string[] = [];

	function search(node: AdminTreeNode, trail: string[]) {
		if (node.type === "page") {
			if (node.relativePath === targetPath) {
				paths.push(...trail);
			}
			return;
		}

		const nextTrail = [...trail, node.path];
		for (const child of node.children ?? []) {
			search(child, nextTrail);
		}
		if (node.index) {
			search(node.index, nextTrail);
		}
	}

	search(tree, []);
	return paths.filter(Boolean);
}

async function fetchJSON(url: string, body: unknown, method: "POST" | "DELETE") {
	const response = await fetch(url, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new Error(`${method} ${url} failed`);
	}
	return response.json().catch(() => ({}));
}

async function generatePreview(content: string): Promise<string> {
	const response = await fetch("/api/admin/wiki/preview", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ content }),
	});

	if (!response.ok) {
		throw new Error("Preview request failed");
	}

	const data = (await response.json()) as { html?: string };
	return data.html ?? '<p class="text-sm text-muted-foreground">Preview unavailable.</p>';
}

function getFolderKeysForFile(filePath: string): string[] {
	const withoutExtension = filePath.replace(/\.mdx$/, "");
	const segments = withoutExtension.split("/").filter(Boolean);
	const folders: string[] = [];
	for (let index = 0; index < segments.length - 1; index += 1) {
		folders.push(segments.slice(0, index + 1).join("/"));
	}
	return folders;
}
