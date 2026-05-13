import { Compass, FileText, LayoutGrid } from 'lucide-react';
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
    {
        href: '/admin/cms',
        icon: FileText,
        title: 'Content',
        description: 'Edit website text, navigation links, pricing, and all page content.',
    },
];

export default async function AdminPage() {
    await requirePageAuth();
    return (
        <AdminShell title='Dashboard'>
            <div>
                <h1 className='text-2xl font-semibold'>Dashboard</h1>
                <p className='text-sm text-muted-foreground mt-1'>Choose a section to manage.</p>
            </div>
            <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl'>
                {SECTIONS.map(({ href, icon: Icon, title, description }) => (
                    <Link key={href} href={href} className='group block'>
                        <Card className='h-full transition-colors group-hover:border-primary/60'>
                            <CardHeader className='gap-4'>
                                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-muted'>
                                    <Icon className='h-5 w-5 text-muted-foreground' />
                                </div>
                                <div>
                                    <CardTitle className='text-base mb-1'>{title}</CardTitle>
                                    <CardDescription className='leading-relaxed'>{description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </AdminShell>
    );
}
