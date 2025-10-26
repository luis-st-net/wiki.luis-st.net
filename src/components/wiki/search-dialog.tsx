"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WikiButton, WikiInput, WikiScrollArea } from "@/components/wiki/wiki-components";
import type { WikiSearchDocument } from "@/lib/wiki/types";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 150;

export function WikiSearchDialog() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<WikiSearchDocument[]>([]);
	const [loading, setLoading] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		function handleKeydown(event: KeyboardEvent) {
			if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
				event.preventDefault();
				setOpen((previous) => !previous);
			}
		}

		window.addEventListener("keydown", handleKeydown);
		return () => window.removeEventListener("keydown", handleKeydown);
	}, []);

	useEffect(() => {
		if (!open) {
			setQuery("");
			setResults([]);
			return;
		}

		inputRef.current?.focus();
	}, [open]);

	useEffect(() => {
		if (!open) return;

		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			search(query);
		}, DEBOUNCE_MS);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query, open]);

	async function search(currentQuery: string) {
		setLoading(true);
		try {
			const response = await fetch(`/api/wiki/search?q=${encodeURIComponent(currentQuery)}`);
			const data = (await response.json()) as { results: WikiSearchDocument[] };
			setResults(data.results);
		} catch (error) {
			console.error("Search failed", error);
			setResults([]);
		} finally {
			setLoading(false);
		}
	}

	const highlightedResults = useMemo(() => highlightResults(results, query), [results, query]);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<WikiButton variant="outline" className="justify-start gap-3 text-sm text-muted-foreground">
					<Search className="h-4 w-4 opacity-70" />
					<span className="flex-1 text-left">Search documentation...</span>
					<kbd className="rounded-md border border-border px-2 py-1 text-[0.65rem] uppercase text-muted-foreground">
						Ctrl K
					</kbd>
				</WikiButton>
			</DialogTrigger>
			<DialogContent className="gap-4 sm:max-w-4xl">
				<DialogHeader className="space-y-1">
					<DialogTitle>Search the wiki</DialogTitle>
				</DialogHeader>
				<div className="flex items-center gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-sm">
					<Search className="h-4 w-4 text-muted-foreground" />
					<WikiInput
						ref={inputRef}
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Type a keyword, heading, or phrase..."
						className="border-0 bg-transparent shadow-none focus-visible:ring-0"
						aria-label="Search wiki content"
					/>
					{query ? (
						<button
							type="button"
							className="rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
							onClick={() => setQuery("")}
							aria-label="Clear search"
						>
							<X className="h-4 w-4" />
						</button>
					) : null}
				</div>
				<WikiScrollArea className="max-h-[420px] w-full rounded-lg border border-border bg-background/80 p-2">
					{loading ? (
						<p className="px-2 py-4 text-sm text-muted-foreground">Searching documentation…</p>
					) : highlightedResults.length === 0 ? (
						<div className="px-2 py-12 text-center text-sm text-muted-foreground">
							{query
								? "No matches found. Try another keyword or check spelling."
								: "Start typing to search titles, headings, and content."}
						</div>
					) : (
						<ul className="space-y-3">
							{highlightedResults.map((result) => (
								<li key={result.id}>
									<a
										href={`/wiki${result.urlPath ? `/${result.urlPath}` : ""}`}
										className="block rounded-lg border border-transparent bg-secondary/30 p-4 transition hover:border-primary/60 hover:bg-secondary/60"
										onClick={() => setOpen(false)}
									>
										<div className="flex flex-col gap-1">
											<span
												className="text-base font-semibold text-foreground"
												dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
											/>
											<span className="text-xs uppercase tracking-wide text-muted-foreground">{result.path}</span>
										</div>
										<p
											className="mt-2 text-sm leading-relaxed text-muted-foreground"
											dangerouslySetInnerHTML={{ __html: result.highlightedSnippet }}
										/>
									</a>
								</li>
							))}
						</ul>
					)}
				</WikiScrollArea>
			</DialogContent>
		</Dialog>
	);
}

type HighlightedResult = WikiSearchDocument & {
	highlightedTitle: string;
	highlightedSnippet: string;
};

function highlightResults(results: WikiSearchDocument[], query: string): HighlightedResult[] {
	if (!query.trim()) {
		return results.map((result) => ({
			...result,
			highlightedTitle: escapeHtml(result.title),
			highlightedSnippet: escapeHtml(result.snippet),
		}));
	}

	const tokens = Array.from(new Set(query.toLowerCase().split(/\s+/).filter(Boolean)));

	return results.map((result) => ({
		...result,
		highlightedTitle: highlightText(result.title, tokens),
		highlightedSnippet: highlightText(result.snippet, tokens),
	}));
}

function highlightText(text: string, tokens: string[]): string {
	let highlighted = escapeHtml(text);

	for (const token of tokens) {
		if (!token) continue;
		const pattern = new RegExp(`(${escapeRegex(token)})`, "gi");
		highlighted = highlighted.replace(pattern, "<mark class=\"rounded-sm bg-primary/20 px-1\">$1</mark>");
	}

	return highlighted;
}

function escapeHtml(input: string): string {
	return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeRegex(input: string): string {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
