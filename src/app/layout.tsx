import type { Metadata } from "next";
import * as Ui from "@/lib/components/ui/";
import "./globals.css";
import React from "react";
import Sidebar from "@/lib/components/sidebar";
import NavigationBar from "@/lib/components/navigation-bar";

export const metadata: Metadata = {
	title: "Website of Luis Staudt",
	description: "This is my personal website, used to showcase my projects and skills.",
	generator: "Next.js",
	creator: "Luis Staudt",
	publisher: "Luis Staudt",
};

export default function (
	{ children }: { children: React.ReactNode },
) {
	return (
		<html lang="en" suppressHydrationWarning>
		<body>
		<Ui.ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<Ui.SidebarProvider>
				<Sidebar/>
				<div className="flex flex-col h-screen w-full">
					<NavigationBar/>
					<main className="flex flex-col items-center flex-1 ml-4 mr-4 overflow-hidden overflow-y-auto">
						{children}
					</main>
					<Ui.ToasterProvider/>
				</div>
			</Ui.SidebarProvider>
		</Ui.ThemeProvider>
		</body>
		</html>
	);
}
