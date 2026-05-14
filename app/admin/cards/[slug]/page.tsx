'use client';

import { useParams, useRouter } from 'next/navigation';
import { DragEvent, SubmitEvent, useEffect, useRef, useState } from 'react';
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
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [zipDragging, setZipDragging] = useState(false);
    const [zipUploading, setZipUploading] = useState(false);
    const [zipError, setZipError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    function acceptZip(file: File | null) {
        if (!file) return;
        if (!file.name.endsWith('.zip')) {
            setZipError('Only .zip files are accepted.');
            return;
        }
        setZipError('');
        setZipFile(file);
    }

    async function handleZipReplace() {
        if (!zipFile) return;
        setZipError('');
        setZipUploading(true);
        const formData = new FormData();
        formData.set('zip', zipFile);
        try {
            const res = await fetch(`/api/admin/cards/${slug}/zip`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                toast.success('Card files replaced!');
                setZipFile(null);
            } else {
                setZipError(data.error ?? 'Replace failed');
            }
        } catch {
            setZipError('Network error.');
        } finally {
            setZipUploading(false);
        }
    }

    return (
        <AdminShell>
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

                    {/* ── Replace dist files ─────────────────────────────── */}
                    <div className='mt-8 pt-6 border-t flex flex-col gap-3'>
                        <div>
                            <h2 className='text-base font-semibold'>Replace Card Files</h2>
                            <p className='text-sm text-muted-foreground'>
                                Drop a new ZIP to replace the current dist — metadata stays unchanged.
                            </p>
                        </div>

                        {zipError && (
                            <Alert variant='destructive'>
                                <AlertDescription>{zipError}</AlertDescription>
                            </Alert>
                        )}

                        <div
                            role='button'
                            tabIndex={0}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                            onDragOver={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setZipDragging(true); }}
                            onDragLeave={() => setZipDragging(false)}
                            onDrop={(e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setZipDragging(false); acceptZip(e.dataTransfer.files?.[0] ?? null); }}
                            className={[
                                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors select-none',
                                zipDragging
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border text-muted-foreground hover:border-primary/60 hover:bg-muted/40',
                            ].join(' ')}
                        >
                            {zipFile ? (
                                <>
                                    <span className='text-2xl'>📦</span>
                                    <p className='text-sm font-medium text-foreground'>{zipFile.name}</p>
                                    <p className='text-xs'>{(zipFile.size / 1024 / 1024).toFixed(2)} MB — click to replace</p>
                                </>
                            ) : (
                                <>
                                    <span className='text-2xl'>⬆️</span>
                                    <p className='text-sm font-medium'>Drop new ZIP here or click to browse</p>
                                    <p className='text-xs'>.zip only</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='.zip'
                            className='sr-only'
                            onChange={(e) => acceptZip(e.target.files?.[0] ?? null)}
                        />
                        <div>
                            <Button onClick={handleZipReplace} disabled={!zipFile || zipUploading || card.status === 'deleted'}>
                                {zipUploading ? 'Replacing…' : 'Replace Files'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
