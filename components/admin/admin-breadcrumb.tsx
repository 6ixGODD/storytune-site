'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LABELS: Record<string, string> = {
    '/admin/cards': 'Cards',
    '/admin/directions': 'Directions',
    '/admin/cms': 'Content',
};

function resolveLabel(pathname: string): string | null {
    for (const [prefix, label] of Object.entries(LABELS)) {
        if (pathname.startsWith(prefix)) return label;
    }
    return null;
}

export function AdminBreadcrumb() {
    const pathname = usePathname();
    const isRoot = pathname === '/admin';
    const label = resolveLabel(pathname);

    if (isRoot || !label) {
        return <span className='text-sm font-medium text-foreground/80'>Dashboard</span>;
    }

    return (
        <nav className='flex items-center gap-1.5 text-sm' aria-label='Breadcrumb'>
            <Link href='/admin' className='text-muted-foreground transition-colors hover:text-foreground flex items-center gap-1'>
                <span>Dashboard</span>
            </Link>
            <ChevronRight className='h-3.5 w-3.5 text-muted-foreground/50 shrink-0' />
            <span className='font-medium text-foreground/80'>{label}</span>
        </nav>
    );
}
