import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "default" | "secondary" | "outline";
}

const VARIANT_STYLES: Record<NonNullable<BadgeProps["variant"]>, string> = {
	default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
	secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
	outline: "border-border text-foreground",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
				VARIANT_STYLES[variant],
				className,
			)}
			{...props}
		/>
	);
}

export { Badge };
