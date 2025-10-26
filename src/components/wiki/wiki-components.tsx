import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input, type InputProps } from "@/components/ui/input";
import { Label, type LabelProps } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea, type TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const WikiButton = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, ...props }, ref) => (
	<Button ref={ref} className={cn("rounded-lg shadow-sm hover:shadow transition-shadow", className)} {...props} />
));
WikiButton.displayName = "WikiButton";

export const WikiInput = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
	<Input
		ref={ref}
		className={cn("rounded-lg border-border bg-background/95 backdrop-blur-sm focus-visible:ring-2", className)}
		{...props}
	/>
));
WikiInput.displayName = "WikiInput";

export const WikiTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
	<Textarea
		ref={ref}
		className={cn("rounded-lg border-border bg-background/95 backdrop-blur-sm focus-visible:ring-2 min-h-[200px]", className)}
		{...props}
	/>
));
WikiTextarea.displayName = "WikiTextarea";

export const WikiLabel = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
	<Label ref={ref} className={cn("text-sm font-semibold text-muted-foreground", className)} {...props} />
));
WikiLabel.displayName = "WikiLabel";

export function WikiPanel({
	className,
	children,
	padding = "p-6",
}: {
	className?: string;
	children: React.ReactNode;
	padding?: string;
}) {
	return (
		<div
			className={cn(
				"rounded-2xl border border-border/70 bg-gradient-to-br from-background/80 via-background/95 to-background shadow-sm",
				padding,
				className,
			)}
		>
			{children}
		</div>
	);
}

export function WikiSection({
	title,
	description,
	action,
	children,
	className,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<WikiPanel className={cn("space-y-6", className)}>
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h2 className="text-lg font-semibold text-foreground">{title}</h2>
					{description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
				</div>
				{action}
			</div>
			{children}
		</WikiPanel>
	);
}

export function WikiBadge({
	variant = "outline",
	...props
}: React.ComponentProps<typeof Badge>) {
	return <Badge variant={variant} {...props} />;
}

export function WikiTabs(props: React.ComponentProps<typeof Tabs>) {
	return <Tabs className="w-full" {...props} />;
}

export { TabsList as WikiTabsList, TabsTrigger as WikiTabsTrigger, TabsContent as WikiTabsContent };

export function WikiSeparator({ className }: { className?: string }) {
	return <Separator className={cn("bg-border/70", className)} />;
}

export function WikiScrollArea(props: React.ComponentProps<typeof ScrollArea>) {
	return <ScrollArea className={cn("scrollbar-thin", props.className)} {...props} />;
}
