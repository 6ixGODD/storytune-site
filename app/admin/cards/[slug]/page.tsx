'use client';

import { useParams, useRouter } from 'next/navigation';
import { SubmitEvent, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AdminShell } from '@/components/admin/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Card {
    slug: string;
    clientName: string;
    clientEmail: string;
    title?: string;
    eventType?: string;
    notes?: string;
    invitees: { name?: string; email: string }[];
    inviteeCount: number;
    cardUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export default function CardDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const [card, setCard] = useState<Card | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/cards/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setCard(d.data);
                else setError(d.error);
            })
            .catch(() => setError('Failed to load card'));
    }, [slug]);

    async function handleSave(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const form = e.currentTarget;
        const getValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;
        const inviteesRaw = getValue('invitees');
        let invitees;
        try {
            invitees = inviteesRaw ? JSON.parse(inviteesRaw) : undefined;
        } catch {
            setError('Invalid JSON in invitees field');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/admin/cards/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientName: getValue('clientName'),
                    clientEmail: getValue('clientEmail'),
                    title: getValue('title') || undefined,
                    eventType: getValue('eventType') || undefined,
                    notes: getValue('notes') || undefined,
                    invitees,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Card saved!');
                router.push('/admin/cards');
                router.refresh();
            } else {
                setError(data.error ?? 'Save failed');
            }
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete() {
        if (!confirm(`Soft-delete card "${slug}"? It will no longer be publicly accessible.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/cards/${slug}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) router.push('/admin/cards');
            else setError(data.error ?? 'Delete failed');
        } catch {
            setError('Network error.');
        } finally {
            setDeleting(false);
        }
    }

    return (
        <AdminShell title={`Card · ${slug}`}>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                    <h1 className='text-2xl font-semibold font-mono'>{slug}</h1>
                    {card && <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status}</Badge>}
                </div>
                <div className='flex gap-2'>
                    {card && (
                        <Button asChild variant='outline' size='sm'>
                            <a href={card.cardUrl} target='_blank' rel='noopener noreferrer'>
                                View ↗
                            </a>
                        </Button>
                    )}
                    <Button variant='ghost' size='sm' onClick={() => router.back()}>
                        ← Back
                    </Button>
                </div>
            </div>

            {!card && !error && <p className='text-muted-foreground'>Loading…</p>}
            {error && (
                <Alert variant='destructive'>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {card && (
                <div className='max-w-2xl'>
                    <form onSubmit={handleSave} className='flex flex-col gap-5'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='clientName'>Client Name *</Label>
                                <Input id='clientName' name='clientName' defaultValue={card.clientName} required />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='clientEmail'>Client Email *</Label>
                                <Input
                                    id='clientEmail'
                                    name='clientEmail'
                                    type='email'
                                    defaultValue={card.clientEmail}
                                    required
                                />
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='title'>Title</Label>
                                <Input id='title' name='title' defaultValue={card.title ?? ''} />
                            </div>
                            <div className='flex flex-col gap-1.5'>
                                <Label htmlFor='eventType'>Event Type</Label>
                                <Input id='eventType' name='eventType' defaultValue={card.eventType ?? ''} />
                            </div>
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='notes'>Notes</Label>
                            <Textarea id='notes' name='notes' rows={3} defaultValue={card.notes ?? ''} />
                        </div>
                        <div className='flex flex-col gap-1.5'>
                            <Label htmlFor='invitees'>
                                Invitees <span className='text-muted-foreground text-xs'>(JSON)</span>
                            </Label>
                            <Textarea
                                id='invitees'
                                name='invitees'
                                rows={6}
                                className='font-mono text-xs'
                                defaultValue={JSON.stringify(card.invitees, null, 2)}
                            />
                        </div>
                        <div className='flex gap-3 pt-2'>
                            <Button type='submit' disabled={loading || card.status === 'deleted'}>
                                {loading ? 'Saving…' : 'Save Changes'}
                            </Button>
                            {card.status === 'active' && (
                                <Button type='button' variant='destructive' onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting…' : 'Delete Card'}
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            )}
        </AdminShell>
    );
}
