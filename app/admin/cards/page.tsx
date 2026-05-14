import Link from 'next/link';

import { AdminShell } from '@/components/admin/admin-shell';
import { CopyButton } from '@/components/admin/cards/copy-button';
import { QrCodePanel } from '@/components/admin/cards/qr-code-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { config } from '@/lib/config';
import { getAuthToken } from '@/lib/infra/auth';
import { requirePageAuth } from '@/lib/infra/page-auth';

export const dynamic = 'force-dynamic';

interface Card {
    slug: string;
    clientName: string;
    clientEmail: string;
    inviteeCount: number;
    cardUrl: string;
    status: string;
    createdAt: string;
    title?: string;
    eventType?: string;
}

async function getCards(page: number) {
    const baseUrl = config.app.baseUrl || 'http://localhost:3000';
    const token = await getAuthToken();
    const res = await fetch(`${baseUrl}/api/admin/cards?page=${page}&pageSize=20`, {
        headers: { Cookie: `auth_token=${token}` },
        cache: 'no-store',
    });
    if (!res.ok) return { items: [], total: 0, page: 1, pageSize: 20 };
    const data = await res.json();
    return data.data;
}

export default async function CardsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
    await requirePageAuth();
    const { page: pageStr } = await searchParams;
    const page = Math.max(1, parseInt(pageStr ?? '1', 10));
    const { items, total, pageSize } = await getCards(page);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <AdminShell>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Cards</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{total} card{total !== 1 ? 's' : ''} total</p>
                </div>
                <Button asChild>
                    <Link href="/admin/cards/upload">Upload Card</Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Slug</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Event</TableHead>
                            <TableHead className="text-right">Invitees</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                                    No cards yet. Upload one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((card: Card) => (
                            <TableRow key={card.slug} className={card.status === 'deleted' ? 'opacity-50' : ''}>
                                <TableCell className="font-mono text-xs">{card.slug}</TableCell>
                                <TableCell className="font-medium">{card.clientName}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{card.clientEmail}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">{card.eventType ?? '—'}</TableCell>
                                <TableCell className="text-right">{card.inviteeCount}</TableCell>
                                <TableCell>
                                    <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>
                                        {card.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {new Date(card.createdAt).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <CopyButton text={card.slug} label='Copy slug' successLabel='Slug copied!' />
                                        <CopyButton
                                            text={`${config.app.baseUrl}/card/${card.slug}`}
                                            label='Copy link'
                                            successLabel='Link copied!'
                                            icon='link'
                                        />
                                        <QrCodePanel slug={card.slug} cardUrl={card.cardUrl} />
                                        <Button asChild variant="ghost" size="sm">
                                            <a href={card.cardUrl} target="_blank" rel="noopener noreferrer">View ↗</a>
                                        </Button>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/admin/cards/${card.slug}`}>Edit</Link>
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