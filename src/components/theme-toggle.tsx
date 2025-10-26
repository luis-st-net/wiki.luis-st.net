"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { WikiButton } from "@/components/wiki/wiki-components";

export function ThemeToggle() {
	const { setTheme, theme, systemTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const currentTheme = theme === "system" ? systemTheme : theme;

	return (
		<WikiButton
			variant="ghost"
			size="icon"
			type="button"
			onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
			aria-label="Toggle color theme"
		>
			{mounted && currentTheme === "dark" ? (
				<Sun className="h-5 w-5" />
			) : (
				<Moon className="h-5 w-5" />
			)}
		</WikiButton>
	);
}
