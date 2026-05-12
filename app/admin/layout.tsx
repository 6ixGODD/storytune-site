import './global.css';

import { ReactNode } from 'react';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className="admin-root bg-background text-foreground font-sans min-h-screen">
            {children}
        </div>
    );
}