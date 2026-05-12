import './global.css';

import { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="admin-root bg-background text-foreground font-sans min-h-screen">
            {children}
            <Toaster richColors position="top-right" />
        </div>
    );
}