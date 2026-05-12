'use client';

import { Compass, LayoutGrid, LogOut } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const NAV_ITEMS = [
    { label: 'Cards', href: '/admin/cards', icon: LayoutGrid },
    { label: 'Directions', href: '/admin/directions', icon: Compass },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch('/api/admin/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    }

    return (
        <Sidebar>
            <SidebarHeader className="border-b px-4 py-5">
                <Image src="/logo.svg" alt="StoryTune" width={120} height={28} priority />
                <span className="text-xs text-muted-foreground mt-0.5">Admin Console</span>
            </SidebarHeader>

            <SidebarContent className="pt-3">
                <SidebarMenu>
                    {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild isActive={pathname.startsWith(href)}>
                                <a href={href}>
                                    <Icon className="h-4 w-4" />
                                    <span>{label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                            <LogOut className="h-4 w-4" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
