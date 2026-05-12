import { Compass, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

import { AdminShell } from '@/components/admin/admin-shell';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requirePageAuth } from '@/lib/infra/page-auth';

const SECTIONS = [
    {
        href: '/admin/cards',
        icon: LayoutGrid,
        title: 'Cards',
        description: 'Upload and manage personalised invitation cards for clients.',
    },
    {
        href: '/admin/directions',
        icon: Compass,
        title: 'Directions',
        description: 'Manage the inspiration gallery — templates, categories, and featured previews.',
    },
];

export default async function AdminPage() {
    await requirePageAuth();
    return (
        <AdminShell title="Dashboard">
            <div>
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Choose a section to manage.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
                {SECTIONS.map(({ href, icon: Icon, title, description }) => (
                    <Link key={href} href={href} className="group block">
                        <Card className="h-full transition-colors group-hover:border-primary">
                            <CardHeader>
                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <CardTitle className="text-base">{title}</CardTitle>
                                <CardDescription>{description}</CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </AdminShell>
    );
}