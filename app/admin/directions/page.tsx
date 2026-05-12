import Link from 'next/link';

import { AdminShell } from '@/components/admin/admin-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/infra/auth';
import { requirePageAuth } from '@/lib/infra/page-auth';

export const dynamic = 'force-dynamic';

interface Inspiration {
    slug: string;
    title: string;
    category: string;
    tags: string[];
    coverPath: string;
    description?: string;
    preview: boolean;
    inspirationUrl: string;
    status: string;
    createdAt: string;
}

async function getInspirations(page: number) {
    const baseUrl = config.app.baseUrl || 'http://localhost:3000';
    const token = await getAuthToken();
    const res = await fetch(`${baseUrl}/api/admin/inspirations?page=${page}&pageSize=20`, {
        headers: { Cookie: `auth_token=${token}` },
        cache: 'no-store',
    });
    if (!res.ok) return { items: [], total: 0, page: 1, pageSize: 20 };
    const data = await res.json();
    return data.data;
}

export default async function DirectionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    await requirePageAuth();
    const { page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const { items, total, pageSize } = await getInspirations(page);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <AdminShell title="Directions">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Directions</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} direction{total !== 1 ? 's' : ''} total</p>
                </div>
                <Button asChild>
                    <Link href="/admin/directions/upload">Upload Direction</Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Slug</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Preview</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                                    No directions yet. Upload one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((item: Inspiration) => (
                            <TableRow key={item.slug} className={item.status === 'deleted' ? 'opacity-50' : ''}>
                                <TableCell className="font-mono text-xs">{item.slug}</TableCell>
                                <TableCell className="font-medium">{item.title}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{item.category}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {item.tags.slice(0, 3).map((tag) => (
                                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                                        ))}
                                        {item.tags.length > 3 && (
                                            <Badge variant="outline" className="text-xs">+{item.tags.length - 3}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.preview
                                        ? <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">Featured</Badge>
                                        : <span className="text-muted-foreground text-sm">—</span>}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                                        {item.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button asChild variant="ghost" size="sm">
                                            <a href={item.inspirationUrl} target="_blank" rel="noopener noreferrer">View ↗</a>
                                        </Button>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/directions/${item.slug}`}>Edit</Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                    <div className="flex gap-2">
                        {page > 1 && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`?page=${page - 1}`}>← Previous</Link>
                            </Button>
                        )}
                        {page < totalPages && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`?page=${page + 1}`}>Next →</Link>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
