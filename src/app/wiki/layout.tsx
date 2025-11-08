import "@/styles/prism.css";
import { WikiHeader } from "@/components/wiki/wiki-header";

type WikiRootLayoutProps = {
	children: React.ReactNode;
};

export default function WikiRootLayout({ children }: WikiRootLayoutProps) {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<WikiHeader />
			<div className="flex flex-1 pt-16">
				{children}
			</div>
		</div>
	);
}
