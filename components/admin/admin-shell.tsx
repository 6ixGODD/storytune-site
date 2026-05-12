import { ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
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
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    {title && (
                        <>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-sm font-medium">{title}</span>
                        </>
                    )}
                </header>
                <div className="flex flex-col gap-6 p-6">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
