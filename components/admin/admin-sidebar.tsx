'use client';

import { Compass, FileText, LayoutGrid, LogOut } from 'lucide-react';
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
    { label: 'Content', href: '/admin/cms', icon: FileText },
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
            <SidebarHeader className='px-6 py-6'>
                <Image src='/logo.svg' alt='StoryTune' width={120} height={28} priority className='invert dark:invert-0' />
            </SidebarHeader>

            <SidebarContent className='px-3'>
                <SidebarMenu>
                    {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
                        <SidebarMenuItem key={href}>
                            <SidebarMenuButton asChild isActive={pathname.startsWith(href)}>
                                <a href={href}>
                                    <Icon className='h-4 w-4' />
                                    <span>{label}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className='px-3 pb-6'>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} className='text-muted-foreground hover:text-foreground'>
                            <LogOut className='h-4 w-4' />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
