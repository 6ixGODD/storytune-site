import './global.css';

import { ThemeProvider } from 'next-themes';
import { ReactNode } from 'react';

import { Toaster } from '@/components/ui/sonner';

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute='class' defaultTheme='dark' disableTransitionOnChange>
            <div className='admin-root min-h-screen bg-background font-sans text-foreground'>
                {children}
                <Toaster richColors position='top-right' />
            </div>
        </ThemeProvider>
    );
}