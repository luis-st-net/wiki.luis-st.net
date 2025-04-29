"use client";

import * as Ui from "@/lib/components/ui/";
import * as Icons from "lucide-react";
import Link from "next/link";
import React from "react";
import { Route } from "@/lib/types";
import { aboutMe, programming, general } from "@/lib/routes";

import { cn } from "@/lib/utility";

const animation = "transition-all duration-200 ease-in-out";

export default function Sidebar() {
	const { open, toggleSidebar } = Ui.useSidebar();
	return (
		<Ui.Sidebar collapsible="icon">
			<Ui.SidebarHeader onClick={toggleSidebar} className="cursor-pointer">
				<div className={cn("flex items-center h-14 mt-1 rounded-lg pt-0 pb-0 bg-custom-light-blue text-custom-black", animation, (open ? "p-2" : "p-1"))}>
					<SidebarHeaderContent open={open}/>
				</div>
			</Ui.SidebarHeader>
			
			<Ui.SidebarContent>
				<SidebarGroup title="About me">
					<Ui.SidebarMenu>
						<SidebarMenuItem route={aboutMe}/>
					</Ui.SidebarMenu>
				</SidebarGroup>
				
				<Ui.SidebarSeparator/>
				
				<SidebarGroup title="Programming">
					<Ui.SidebarMenu>
						{programming.subRoutes.map((route, index) => (
							<CollapsibleSidebarMenuItem key={index} parentRoute={programming} route={route}/>
						))}
					</Ui.SidebarMenu>
				</SidebarGroup>
				
				<Ui.SidebarSeparator/>
				
				<SidebarGroup title="General">
					<Ui.SidebarMenu>
						{general.subRoutes.map((route, index) => (
							<SidebarMenuItem key={index} parentRoute={general} route={route}/>
						))}
					</Ui.SidebarMenu>
				</SidebarGroup>
			</Ui.SidebarContent>
			
			<Ui.SidebarFooter>
				<div className={cn("flex items-center h-10 mb-1 rounded-md pt-0 pb-0 bg-custom-light-blue text-custom-black pl-[9px]", (open ? "p-2" : ""))}>
					<SidebarFooterContent open={open}/>
				</div>
			</Ui.SidebarFooter>
		</Ui.Sidebar>
	);
}

function SidebarHeaderContent(
	{ open }: { open: boolean },
) {
	if (!open) {
		return <SidebarHeaderAvatar open={open}/>;
	}
	return (
		<>
			<SidebarHeaderAvatar open={open}/>
			<div className="ml-3.5 mt-1 mb-1">
				<p className="text-lg font-bold text-nowrap">
					Luis Staudt
				</p>
				<p className="text-sm text-nowrap">
					Hobby Developer
				</p>
			</div>
		</>
	);
}

function SidebarHeaderAvatar(
	{ open }: { open: boolean },
) {
	return (
		<Ui.Avatar className={cn(animation, (open ? "w-10 h-10" : "w-6 h-6"))}>
			<Ui.AvatarImage src="https://avatars.githubusercontent.com/u/76595940?v=4"/>
			<Ui.AvatarFallback>
				LS
			</Ui.AvatarFallback>
		</Ui.Avatar>
	);
}

function SidebarGroup(
	{ title, children }: { title?: string, children: React.ReactNode },
) {
	return (
		<Ui.SidebarGroup>
			{title && <Ui.SidebarGroupLabel>{title}</Ui.SidebarGroupLabel>}
			<Ui.SidebarGroupContent>
				{children}
			</Ui.SidebarGroupContent>
		</Ui.SidebarGroup>
	);
}

function SidebarMenuItem(
	{ parentRoute, route }: { parentRoute?: Route, route: Route },
) {
	return (
		<Ui.SidebarMenuItem>
			<Ui.SidebarMenuButton asChild>
				<Link href={parentRoute ? parentRoute.route + route.route : route.route}>
					{route.icon && <route.icon/>}
					<span>{route.title}</span>
				</Link>
			</Ui.SidebarMenuButton>
		</Ui.SidebarMenuItem>
	);
}

function CollapsibleSidebarMenuItem(
	{ parentRoute, route }: { parentRoute: Route, route: Route },
) {
	return (
		<Ui.Collapsible className="group/collapsible">
			<Ui.SidebarMenuItem>
				<Ui.CollapsibleTrigger asChild>
					<Ui.SidebarMenuButton>
						{route.icon && <route.icon/>}
						<span>{
							route.title}
						</span>
						<Icons.ChevronRight className="ml-auto duration-400 ease group-data-[state=open]/collapsible:rotate-90"/>
					</Ui.SidebarMenuButton>
				</Ui.CollapsibleTrigger>
				<Ui.CollapsibleContent>
					<Ui.SidebarMenuSub>
						{route.subRoutes.map(subItem => (
							<Ui.SidebarMenuSubItem key={subItem.title} className="block">
								<Ui.SidebarMenuSubButton href="" asChild>
									<Link href={parentRoute.route + route.route + subItem.route}>
										<span>
											{subItem.title}
										</span>
									</Link>
								</Ui.SidebarMenuSubButton>
							</Ui.SidebarMenuSubItem>
						))}
					</Ui.SidebarMenuSub>
				</Ui.CollapsibleContent>
			</Ui.SidebarMenuItem>
		</Ui.Collapsible>
	);
}

function SidebarFooterContent(
	{ open }: { open: boolean },
) {
	if (!open) {
		return (
			<>©</>
		);
	}
	return (
		<p className="text-base text-nowrap">
			© {new Date().getFullYear()} Luis Staudt
		</p>
	);
}
