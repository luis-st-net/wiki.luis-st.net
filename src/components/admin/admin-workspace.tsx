'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
	Bold,
	Code,
	File,
	Heading2,
	Italic,
	Link as LinkIcon,
	List,
	ListOrdered,
	Loader2,
	Quote,
	Save,
	Trash2,
	ChevronRight,
	Code2,
} from "lucide-react";
import { diffLines } from "diff";
import type { AdminTreeNode } from "@/lib/wiki/admin-tree";
import type { AdminFileDescriptor } from "@/lib/wiki/admin";
import { WikiBadge, WikiButton, WikiInput, WikiScrollArea } from "@/components/wiki/wiki-components";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { segmentsEqual } from "@/lib/wiki/slug";

const PREVIEW_DEBOUNCE = 350;
const DEFAULT_FILE_CONTENT = `---\ntitle: New Wiki Page\ndescription: Provide a short summary.\norder: 999\n---\n\n## Welcome\n\nStart documenting your project here.`;
const SIDEBAR_WIDTH_KEY = "wiki-admin-sidebar-width";

type AdminWorkspaceProps = {
	initialTree: AdminTreeNode;
	initialFile: AdminFileDescriptor | null;
};

type FolderOption = { value: string; label: string };

type DraftState = {
	path: string;
	content: string;
};

type EditorAction =
	| "bold"
	| "italic"
	| "heading"
	| "blockquote"
	| "unordered-list"
	| "ordered-list"
	| "inline-code"
	| "code-block"
	| "link";

type ToolbarButtonConfig =
	| {
			type: "button";
			action: EditorAction;
			label: string;
			icon: LucideIcon;
	  }
	| { type: "divider"; id: string };

const toolbarButtons: ToolbarButtonConfig[] = [
	{ type: "button", action: "bold", label: "Bold", icon: Bold },
	{ type: "button", action: "italic", label: "Italic", icon: Italic },
	{ type: "button", action: "heading", label: "Heading", icon: Heading2 },
	{ type: "divider", id: "typography" },
	{ type: "button", action: "inline-code", label: "Inline code", icon: Code2 },
	{ type: "button", action: "code-block", label: "Code block", icon: Code },
	{ type: "divider", id: "structure" },
	{ type: "button", action: "blockquote", label: "Blockquote", icon: Quote },
	{ type: "button", action: "unordered-list", label: "Bullet list", icon: List },
	{ type: "button", action: "ordered-list", label: "Numbered list", icon: ListOrdered },
	{ type: "divider", id: "linking" },
	{ type: "button", action: "link", label: "Link", icon: LinkIcon },
];

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
	const previewTimeout = useRef<NodeJS.Timeout | null>(null);
	const editorRef = useRef<HTMLTextAreaElement | null>(null);
	const [lastSavedContent, setLastSavedContent] = useState(defaultContent);

	const folderOptions = useMemo(() => flattenFolders(tree), [tree]);
	const diffVisualization = useMemo(() => buildInlineDiff(lastSavedContent, draft.content), [lastSavedContent, draft.content]);
	const hasPendingChanges = diffVisualization.lines.some((entry) => entry.kind !== "context") || diffVisualization.removals.length > 0;
	const [editorScroll, setEditorScroll] = useState({ top: 0, left: 0 });
	const LINE_HEIGHT_PX = 28;
	const PADDING_TOP_PX = 16;
	const [sidebarWidth, setSidebarWidth] = useState(320);
	const [isResizingSidebar, setIsResizingSidebar] = useState(false);
	const resizeStart = useRef<{ x: number; width: number } | null>(null);

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

	useEffect(() => {
		setEditorScroll({ top: 0, left: 0 });
		if (editorRef.current) {
			editorRef.current.scrollTop = 0;
			editorRef.current.scrollLeft = 0;
		}
	}, [draft.path]);

	useLayoutEffect(() => {
		// ensure width is applied before paint to avoid clipping during initial render
		if (typeof window === "undefined") return;
		const stored = window.localStorage.getItem(SIDEBAR_WIDTH_KEY);
		if (!stored) return;
		const parsed = Number.parseInt(stored, 10);
		if (Number.isFinite(parsed)) {
			setSidebarWidth(Math.min(520, Math.max(220, parsed)));
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		window.localStorage.setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth));
	}, [sidebarWidth]);

	useEffect(() => {
		function handleMouseMove(event: MouseEvent) {
			if (!isResizingSidebar || !resizeStart.current) return;
			const delta = event.clientX - resizeStart.current.x;
			const nextWidth = Math.min(520, Math.max(220, resizeStart.current.width + delta));
			setSidebarWidth(nextWidth);
		}

		function handleMouseUp() {
			setIsResizingSidebar(false);
			resizeStart.current = null;
		}

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isResizingSidebar]);

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

	async function handleDeletePageFromSidebar(path: string | null) {
		if (!path) return;
		await deletePageAtPath(path);
	}

	async function handleSelect(path: string | null) {
		if (!path) return;

		if (hasPendingChanges) {
			const confirmLeave = window.confirm("You have unsaved changes. Discard them?");
			if (!confirmLeave) return;
		}

		setIsLoadingFile(true);
		try {
			const response = await fetch(`/api/admin/wiki/files?path=${encodeURIComponent(path)}`);
			if (!response.ok) throw new Error("Failed to load file");
			const data = (await response.json()) as { file: AdminFileDescriptor };
			setDraft({ path: data.file.path, content: data.file.content });
			setLastSavedContent(data.file.content);
			setSelectedPath(data.file.path);
			setExpanded((prev) => {
				const next = new Set(prev);
				for (const key of getFolderKeysForFile(data.file.path)) {
					next.add(key);
				}
				return next;
			});
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
			setLastSavedContent(draft.content);
			await refreshTree();
		} catch (error) {
			console.error("Save failed", error);
			setStatusMessage("Failed to save file");
		} finally {
			setIsSaving(false);
		}
	}

	async function deletePageAtPath(targetPath: string) {
		if (!targetPath) return;
		if (!window.confirm(`Delete ${targetPath}? This action cannot be undone.`)) return;

		setIsDeleting(true);
		try {
			const response = await fetch("/api/admin/wiki/files", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ path: targetPath }),
			});
			if (!response.ok) throw new Error("Unable to delete file");
			setStatusMessage("File deleted");
			if (targetPath === draft.path) {
				setDraft({ path: "", content: DEFAULT_FILE_CONTENT });
				setLastSavedContent(DEFAULT_FILE_CONTENT);
				setSelectedPath(null);
			}
			await refreshTree();
		} catch (error) {
			console.error("Delete failed", error);
			setStatusMessage("Failed to delete file");
		} finally {
			setIsDeleting(false);
		}
	}

	async function handleDelete() {
		if (!draft.path) return;
		await deletePageAtPath(draft.path);
	}

	function updateDraftContent(value: string) {
		setDraft((previous) => ({ ...previous, content: value }));
	}

	function handleEditorScroll(event: React.UIEvent<HTMLTextAreaElement>) {
		setEditorScroll({
			top: event.currentTarget.scrollTop,
			left: event.currentTarget.scrollLeft,
		});
	}

	function handleRevertChanges() {
		if (!hasPendingChanges) return;
		const shouldRevert = window.confirm("Discard all unsaved changes and revert to the last saved version?");
		if (!shouldRevert) return;
		if (editorRef.current) {
			editorRef.current.value = lastSavedContent;
		}
		updateDraftContent(lastSavedContent);
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

	function beginSidebarResize(event: React.MouseEvent<HTMLDivElement>) {
		event.preventDefault();
		resizeStart.current = { x: event.clientX, width: sidebarWidth };
		setIsResizingSidebar(true);
	}

	function applyEditorTransformation(
		transformer: (context: { value: string; selectionStart: number; selectionEnd: number }) =>
			| {
					replacement: string;
					selectionStartOffset: number;
					selectionEndOffset: number;
					rangeStart?: number;
					rangeEnd?: number;
			  }
			| null,
	) {
		const textarea = editorRef.current;
		if (!textarea) return;
		const selectionStart = textarea.selectionStart;
		const selectionEnd = textarea.selectionEnd;
		const value = textarea.value;
		const result = transformer({ value, selectionStart, selectionEnd });
		if (!result) return;

		const rangeStart = result.rangeStart ?? selectionStart;
		const rangeEnd = result.rangeEnd ?? selectionEnd;
		textarea.setRangeText(result.replacement, rangeStart, rangeEnd, "start");
		const newSelectionStart = rangeStart + result.selectionStartOffset;
		const newSelectionEnd = rangeStart + result.selectionEndOffset;
		textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
		updateDraftContent(textarea.value);
		textarea.focus();
	}

	function handleFormatRequest(action: EditorAction) {
		const textarea = editorRef.current;
		if (!textarea) return;

		switch (action) {
			case "bold":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "bold text" : value.slice(selectionStart, selectionEnd);
					return {
						replacement: `**${selected}**`,
						selectionStartOffset: 2,
						selectionEndOffset: 2 + selected.length,
					};
				});
				break;
			case "italic":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "emphasis" : value.slice(selectionStart, selectionEnd);
					return {
						replacement: `*${selected}*`,
						selectionStartOffset: 1,
						selectionEndOffset: 1 + selected.length,
					};
				});
				break;
			case "inline-code":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "inline-code" : value.slice(selectionStart, selectionEnd);
					return {
						replacement: `\`${selected}\``,
						selectionStartOffset: 1,
						selectionEndOffset: 1 + selected.length,
					};
				});
				break;
			case "code-block":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "console.log(\"Hello\");" : value.slice(selectionStart, selectionEnd);
					const needsLeadingSpace = selectionStart > 0 && !value.slice(0, selectionStart).endsWith("\n\n");
					const prefix = needsLeadingSpace ? "\n\n```" : "```";
					const suffix = value.slice(selectionEnd).startsWith("\n") ? "\n```\n" : "\n```\n\n";
					const replacement = `${prefix}\n${selected}\n${suffix}`;
					const startOffset = prefix.length + 1;
					return {
						replacement,
						selectionStartOffset: startOffset,
						selectionEndOffset: startOffset + selected.length,
					};
				});
				break;
			case "heading":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "Heading title" : value.slice(selectionStart, selectionEnd);
					const needsSpacing = selectionStart > 0 && value[selectionStart - 1] !== "\n";
					const prefix = needsSpacing ? "\n\n## " : "## ";
					const suffix = value.slice(selectionEnd).startsWith("\n") ? "\n" : "\n\n";
					const replacement = `${prefix}${selected}${suffix}`;
					return {
						replacement,
						selectionStartOffset: prefix.length,
						selectionEndOffset: prefix.length + selected.length,
					};
				});
				break;
			case "blockquote":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "Quote text" : value.slice(selectionStart, selectionEnd);
					const lines = selected.split(/\r?\n/).map((line) => line || "Quote text");
					const quoted = lines.map((line) => `> ${line}`).join("\n");
					return {
						replacement: quoted,
						selectionStartOffset: 2,
						selectionEndOffset: 2 + lines[0].length,
					};
				});
				break;
			case "unordered-list":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "List item" : value.slice(selectionStart, selectionEnd);
					const lines = selected.split(/\r?\n/).map((line) => line || "List item");
					const list = lines.map((line) => `- ${line}`).join("\n");
					return {
						replacement: list,
						selectionStartOffset: 2,
						selectionEndOffset: 2 + lines[0].length,
					};
				});
				break;
			case "ordered-list":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "List item" : value.slice(selectionStart, selectionEnd);
					const lines = selected.split(/\r?\n/).map((line) => line || "List item");
					const list = lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
					return {
						replacement: list,
						selectionStartOffset: 3,
						selectionEndOffset: 3 + lines[0].length,
					};
				});
				break;
			case "link":
				applyEditorTransformation(({ value, selectionStart, selectionEnd }) => {
					const selected = selectionStart === selectionEnd ? "Link text" : value.slice(selectionStart, selectionEnd);
					const urlPlaceholder = "https://example.com";
					const replacement = `[${selected}](${urlPlaceholder})`;
					return {
						replacement,
						selectionStartOffset: selected.length + 3,
						selectionEndOffset: selected.length + 3 + urlPlaceholder.length,
					};
				});
				break;
			default:
				break;
		}
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
		<div className={cn("relative flex h-full w-full flex-col bg-background lg:flex-row", isResizingSidebar && "select-none")}>
			<aside
				suppressHydrationWarning
				className="relative z-30 flex w-full flex-col flex-none border-b border-border/70 bg-background/95/90 lg:w-auto lg:border-b-0 lg:border-r"
				style={{ width: sidebarWidth, minWidth: 220, maxWidth: 520 }}
			>
				<div className="border-b border-border/60 px-5 py-5">
					<p className="text-xs uppercase tracking-wide text-muted-foreground">Navigation</p>
					<h2 className="mt-1 text-lg font-semibold text-foreground">Wiki Structure</h2>
					<p className="text-sm text-muted-foreground">Browse the same hierarchy readers see.</p>
					<div className="mt-4 flex flex-wrap gap-2">
						<WikiButton size="sm" onClick={() => setIsCreateDialogOpen("page")}>
							New Page
						</WikiButton>
						<WikiButton size="sm" variant="outline" onClick={() => setIsCreateDialogOpen("folder")}>
							New Folder
						</WikiButton>
					</div>
				</div>
				<WikiScrollArea className="flex-1 px-2 py-4">
					<div className="space-y-1 pr-2 text-sm">
							<AdminSidebarTree
								node={tree}
								selectedPath={selectedPath}
								expanded={expanded}
								onToggle={toggleFolder}
								onSelect={handleSelect}
								onDeleteFolder={handleDeleteFolder}
								onDeletePage={handleDeletePageFromSidebar}
							/>
					</div>
				</WikiScrollArea>
			</aside>
			<div
				className={cn(
					"hidden lg:block w-1.5 flex-none cursor-col-resize bg-border/70 transition z-40",
					isResizingSidebar ? "bg-primary/50" : "hover:bg-primary/40",
				)}
				onMouseDown={beginSidebarResize}
				role="separator"
				aria-orientation="vertical"
				aria-label="Resize sidebar"
			/>
			<section className="relative z-0 flex flex-1 flex-col overflow-hidden">
				<div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 px-6 py-4">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Editing</p>
						<p className="text-sm font-semibold text-foreground">{draft.path || "Select or create a page"}</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<span
							className={cn(
								"rounded-full px-3 py-1 text-xs font-semibold",
								hasPendingChanges ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400",
							)}
						>
							{hasPendingChanges ? "Unsaved changes" : "All changes saved"}
						</span>
						{statusMessage ? <WikiBadge variant="outline">{statusMessage}</WikiBadge> : null}
						<WikiButton
							variant="secondary"
							size="sm"
							disabled={!hasPendingChanges}
							onClick={handleRevertChanges}
							className="bg-muted text-muted-foreground hover:bg-muted/80"
						>
							Rollback
						</WikiButton>
						<WikiButton
							variant="outline"
							size="sm"
							disabled={!draft.path || isDeleting || isSaving}
							onClick={handleDelete}
						>
							{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
						</WikiButton>
						<WikiButton size="sm" onClick={handleSave} disabled={isSaving || !draft.path || !hasPendingChanges}>
							{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
						</WikiButton>
					</div>
				</div>
				<div className="flex flex-1 flex-col gap-6 overflow-hidden px-4 py-4 lg:px-8">
					<div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
						<div className="flex min-h-[420px] flex-col rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
							<div className="border-b border-border/60 px-5 py-4">
								<p className="text-sm font-semibold text-foreground">Markdown Editor</p>
								<p className="text-xs text-muted-foreground">Use the toolbar for fast formatting.</p>
							</div>
							<EditorToolbar onFormat={handleFormatRequest} />
							<div className="flex flex-wrap items-center gap-3 border-b border-border/60 px-5 py-2 text-[0.65rem] uppercase tracking-wide text-muted-foreground">
								<span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">+ Added</span>
								<span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-sky-300">± Changed</span>
								<span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-300">- Removed</span>
							</div>
							<div className="relative flex-1 overflow-hidden">
								<div className="pointer-events-none absolute inset-0 rounded-3xl rounded-t-none">
									<div
										className="px-5 py-4 font-mono text-base leading-7 text-transparent"
										style={{
											transform: `translate(-${editorScroll.left}px, -${editorScroll.top}px)`,
										}}
									>
										{diffVisualization.lines.map((line, index) => {
											const previousKind = diffVisualization.lines[index - 1]?.kind;
											const nextKind = diffVisualization.lines[index + 1]?.kind;
											const isHighlight = line.kind !== "context";
											const isBlockStart = isHighlight && previousKind !== line.kind;
											const isBlockEnd = isHighlight && nextKind !== line.kind;

											return (
												<div
													key={`${line.kind}-${index}`}
													className={cn(
														"relative whitespace-pre-wrap px-1 transition",
														line.kind === "context" && "border-l-4 border-transparent",
														line.kind === "added" && "bg-emerald-500/15 border-l-4 border-emerald-400/70 pl-2",
														line.kind === "changed" && "bg-sky-500/25 border-l-4 border-sky-400/70 pl-2",
														isBlockStart && "rounded-t-xl",
														isBlockEnd && "rounded-b-xl mb-2",
													)}
												>
													{line.text || " "}
												</div>
											);
										})}
									</div>
									{diffVisualization.removals.map((removal, index) => (
										<div
											key={`removal-${index}`}
											className="pointer-events-none absolute inset-x-6 rounded-2xl border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-[0.75rem] text-rose-100 shadow-lg backdrop-blur"
											style={{
												top: `${PADDING_TOP_PX - editorScroll.top + removal.anchor * LINE_HEIGHT_PX}px`,
											}}
										>
											<p className="flex items-center gap-2 text-[0.6rem] uppercase tracking-wide text-rose-200">
												Removed segment
												<span className="h-px flex-1 bg-rose-200/40" />
											</p>
											<div className="mt-1 whitespace-pre-wrap font-mono leading-5">
												{removal.lines.map((line, lineIndex) => (
													<div key={lineIndex} className="flex gap-2">
														<span className="text-rose-300 opacity-70">-</span>
														<span className="flex-1 line-through">{line || " "}</span>
													</div>
												))}
											</div>
										</div>
									))}
								</div>
								{isLoadingFile ? (
									<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
										Loading content…
									</div>
								) : (
									<textarea
										ref={editorRef}
										value={draft.content}
										onChange={(event) => updateDraftContent(event.target.value)}
										onScroll={handleEditorScroll}
										className="relative z-10 h-full w-full resize-none rounded-3xl rounded-t-none border-0 bg-transparent px-5 py-4 font-mono text-base leading-7 text-foreground outline-none focus:outline-none"
									/>
								)}
								<div className="pointer-events-none absolute inset-0 rounded-3xl rounded-t-none border border-transparent shadow-inner shadow-primary/10" />
							</div>
						</div>
						<div className="flex min-h-[320px] flex-col rounded-3xl border border-border/70 bg-card/80 shadow-sm backdrop-blur">
							<div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
								<p className="text-sm font-semibold text-foreground">Live Preview</p>
								<span className="text-xs text-muted-foreground">Auto-updates</span>
							</div>
							<div className="flex-1 overflow-y-auto px-5 py-5">
								<div
									className="wiki-prose mx-auto max-w-3xl"
									dangerouslySetInnerHTML={{
										__html: previewHtml || '<p class="text-sm text-muted-foreground">Preview will appear here.</p>',
									}}
								/>
							</div>
						</div>
					</div>
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

type AdminSidebarTreeProps = {
	node: AdminTreeNode;
	selectedPath: string | null;
	expanded: Set<string>;
	onToggle: (path: string) => void;
	onSelect: (path: string | null) => void;
	onDeleteFolder: (path: string) => void;
	onDeletePage: (path: string | null) => void;
	depth?: number;
};

function AdminSidebarTree({
	node,
	selectedPath,
	expanded,
	onToggle,
	onSelect,
	onDeleteFolder,
	onDeletePage,
	depth = 0,
}: AdminSidebarTreeProps) {
	if (node.type === "folder" && depth === 0) {
		const filteredChildren =
			node.children?.filter((child) => !(child.type === "page" && segmentsEqual(child.slug, node.slug))) ?? [];

		return (
			<div className="space-y-1">
				{node.index ? (
					<AdminSidebarTree
						node={node.index}
						selectedPath={selectedPath}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						onDeletePage={onDeletePage}
						depth={depth + 1}
					/>
				) : null}
				{filteredChildren.map((child) => (
					<AdminSidebarTree
						key={`${child.type}-${child.path}-${child.relativePath ?? ""}`}
						node={child}
						selectedPath={selectedPath}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						onDeletePage={onDeletePage}
						depth={depth + 1}
					/>
				))}
			</div>
		);
	}

	if (node.type === "page") {
		const isActive = selectedPath === node.relativePath;
		return (
			<div
				className={cn(
					"group relative flex w-full min-w-0 items-center gap-2 rounded-md px-2 pr-3 py-1.5 text-sm transition",
					isActive
						? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/40"
						: "text-muted-foreground hover:bg-muted hover:text-foreground",
				)}
				style={depth ? { marginLeft: `calc(${depth} * 0.85rem)` } : undefined}
			>
				<button
					type="button"
					onClick={() => onSelect(node.relativePath ?? null)}
					className="flex flex-1 min-w-0 items-center gap-2 truncate text-left"
				>
					<File className="h-3.5 w-3.5 text-muted-foreground" />
					<span className="truncate">{node.title}</span>
				</button>
				<button
					type="button"
					aria-label={`Delete ${node.title}`}
					onClick={(event) => {
						event.stopPropagation();
						onDeletePage(node.relativePath ?? null);
					}}
					className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
				>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			</div>
		);
	}

	const folderKey = node.path || node.slug.join("/") || "/";
	const isExpanded = expanded.has(folderKey);
	const children =
		node.children?.filter((child) => !(child.type === "page" && segmentsEqual(child.slug, node.slug))) ?? [];

	return (
		<div>
			<div
				className="flex items-center gap-1 rounded-md px-1"
				style={depth ? { marginLeft: `calc(${depth} * 0.75rem)` } : undefined}
			>
				<button
					type="button"
					onClick={() => onToggle(folderKey)}
					className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
				>
					<ChevronRight
						className={cn(
							"h-4 w-4 shrink-0 text-muted-foreground transition",
							isExpanded && "rotate-90 text-foreground",
						)}
					/>
					<span className="truncate text-foreground">{node.title}</span>
					<span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-semibold text-muted-foreground">
						{children.length + (node.index ? 1 : 0)}
					</span>
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
						aria-label={`Delete folder ${node.title}`}
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				) : null}
			</div>
			{isExpanded ? (
				<div className="mt-1 space-y-1 pl-4">
					{node.index ? (
						<AdminSidebarTree
						node={node.index}
						selectedPath={selectedPath}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						onDeletePage={onDeletePage}
						depth={depth + 1}
					/>
				) : null}
				{children.map((child) => (
						<AdminSidebarTree
							key={`${child.type}-${child.path}-${child.relativePath ?? ""}`}
							node={child}
						selectedPath={selectedPath}
						expanded={expanded}
						onToggle={onToggle}
						onSelect={onSelect}
						onDeleteFolder={onDeleteFolder}
						onDeletePage={onDeletePage}
						depth={depth + 1}
					/>
				))}
				</div>
			) : null}
		</div>
	);
}

function EditorToolbar({ onFormat }: { onFormat: (action: EditorAction) => void }) {
	return (
		<div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
			{toolbarButtons.map((item) =>
				item.type === "divider" ? (
					<span key={item.id} className="hidden h-6 w-px bg-border/60 sm:block" aria-hidden="true" />
				) : (
					<button
						key={item.action}
						type="button"
						onClick={() => onFormat(item.action)}
						className="inline-flex items-center justify-center rounded-lg border border-transparent bg-muted/40 px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
					>
						<item.icon className="h-4 w-4" />
						<span className="sr-only">{item.label}</span>
					</button>
				),
			)}
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

type InlineDiffLine = {
	text: string;
	kind: "context" | "added" | "changed";
};

type InlineRemoval = {
	lines: string[];
	anchor: number;
};

type InlineDiffVisualization = {
	lines: InlineDiffLine[];
	removals: InlineRemoval[];
};

function splitLines(value: string): string[] {
	const normalized = value.replace(/\r/g, "");
	const parts = normalized.split("\n");
	if (parts.length && parts[parts.length - 1] === "") {
		parts.pop();
	}
	return parts;
}

function buildInlineDiff(previous: string, next: string): InlineDiffVisualization {
	const raw = diffLines(previous, next);
	const lines: InlineDiffLine[] = [];
	const removals: InlineRemoval[] = [];
	let anchorIndex = 0;

	const pushLines = (entries: string[], kind: InlineDiffLine["kind"]) => {
		for (const entry of entries) {
			lines.push({ text: entry, kind });
			anchorIndex += 1;
		}
	};

	for (let index = 0; index < raw.length; index += 1) {
		const part = raw[index];
		const content = splitLines(part.value);

		if (part.removed) {
			const nextPart = raw[index + 1];
			const removedLines = content;
			// Treat a removal immediately followed by an addition as an in-place change
			// to avoid flagging the same edit as both "removed" and "changed".
			if (nextPart?.added) {
				pushLines(splitLines(nextPart.value), "changed");
				index += 1; // Skip the paired addition
			} else {
				removals.push({ lines: removedLines, anchor: anchorIndex });
			}
			continue;
		}

		if (part.added) {
			pushLines(content, "added");
			continue;
		}

		pushLines(content, "context");
	}

	if (lines.length === 0) {
		lines.push({ text: "", kind: "context" });
	}

	return { lines, removals };
}
