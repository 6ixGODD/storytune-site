import { ReactNode } from 'react';

import { ThemeToggle } from '@/components/admin/theme-toggle';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

import { AdminSidebar } from './admin-sidebar';

interface AdminShellProps {
    children: ReactNode;
    title?: string;
}

export function AdminShell({ children, title }: AdminShellProps) {
    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>
                <header className='flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-6'>
                    <SidebarTrigger className='-ml-1' />
                    {title && <span className='text-sm font-medium text-foreground/80'>{title}</span>}
                    <div className='ml-auto'>
                        <ThemeToggle />
                    </div>
                </header>
                <div className='flex flex-col gap-8 p-8'>{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
