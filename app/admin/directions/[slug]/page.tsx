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
    updatedAt: string;
}

export default function DirectionDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const router = useRouter();
    const [item, setItem] = useState<Inspiration | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [zipDragging, setZipDragging] = useState(false);
    const [zipUploading, setZipUploading] = useState(false);
    const [zipError, setZipError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/admin/inspirations/${slug}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.success) setItem(d.data);
                else setError(d.error);
            })
            .catch(() => setError('Failed to load direction'));
    }, [slug]);

    async function handleSave(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);
        const form = e.currentTarget;
        const getValue = (name: string) => (form.elements.namedItem(name) as HTMLInputElement)?.value;
        const previewEl = form.elements.namedItem('preview') as HTMLInputElement;

        try {
            const tagsRaw = getValue('tags');
            const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

            const res = await fetch(`/api/admin/inspirations/${slug}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: getValue('title') || undefined,
                    category: getValue('category') || undefined,
                    coverPath: getValue('coverPath') || undefined,
                    description: getValue('description') || undefined,
                    tags,
                    preview: previewEl?.checked ?? false,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Direction saved!');
                router.push('/admin/directions');
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
        if (!confirm(`Soft-delete direction "${slug}"? It will no longer be publicly accessible.`)) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/inspirations/${slug}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) router.push('/admin/directions');
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
            const res = await fetch(`/api/admin/inspirations/${slug}/zip`, { method: 'POST', body: formData });
            const data = await res.json();
            if (data.success) {
                toast.success('Direction files replaced!');
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-semibold font-mono">{slug}</h1>
                    {item && <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>{item.status}</Badge>}
                    {item?.preview && <Badge className="bg-amber-500/15 text-amber-700 border-amber-200">Featured</Badge>}
                </div>
                <div className="flex gap-2">
                    {item && (
                        <Button asChild variant="outline" size="sm">
                            <a href={item.inspirationUrl} target="_blank" rel="noopener noreferrer">View ↗</a>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => router.back()}>← Back</Button>
                </div>
            </div>

            {!item && !error && <p className="text-muted-foreground">Loading…</p>}
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            {item && (
                <div className="max-w-2xl">
                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="title">Title *</Label>
                                <Input id="title" name="title" defaultValue={item.title} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="category">Category *</Label>
                                <Input id="category" name="category" defaultValue={item.category} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="coverPath">Cover Path *</Label>
                                <Input id="coverPath" name="coverPath" defaultValue={item.coverPath} required />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="tags">Tags <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                                <Input id="tags" name="tags" defaultValue={item.tags.join(', ')} />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" rows={3} defaultValue={item.description ?? ''} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="preview"
                                name="preview"
                                defaultChecked={item.preview}
                                className="h-4 w-4 rounded border-input accent-primary"
                            />
                            <Label htmlFor="preview" className="cursor-pointer">Feature on homepage preview grid</Label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={loading || item.status === 'deleted'}>
                                {loading ? 'Saving…' : 'Save Changes'}
                            </Button>
                            {item.status === 'active' && (
                                <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
                                    {deleting ? 'Deleting…' : 'Delete Direction'}
                                </Button>
                            )}
                        </div>
                    </form>

                    {/* ── Replace dist files ─────────────────────────────── */}
                    <div className="mt-8 pt-6 border-t flex flex-col gap-3">
                        <div>
                            <h2 className="text-base font-semibold">Replace Direction Files</h2>
                            <p className="text-sm text-muted-foreground">
                                Drop a new ZIP to replace the current dist — metadata stays unchanged.
                            </p>
                        </div>

                        {zipError && (
                            <Alert variant="destructive">
                                <AlertDescription>{zipError}</AlertDescription>
                            </Alert>
                        )}

                        <div
                            role="button"
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
                                    <span className="text-2xl">📦</span>
                                    <p className="text-sm font-medium text-foreground">{zipFile.name}</p>
                                    <p className="text-xs">{(zipFile.size / 1024 / 1024).toFixed(2)} MB — click to replace</p>
                                </>
                            ) : (
                                <>
                                    <span className="text-2xl">⬆️</span>
                                    <p className="text-sm font-medium">Drop new ZIP here or click to browse</p>
                                    <p className="text-xs">.zip only</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            className="sr-only"
                            onChange={(e) => acceptZip(e.target.files?.[0] ?? null)}
                        />
                        <div>
                            <Button onClick={handleZipReplace} disabled={!zipFile || zipUploading || item.status === 'deleted'}>
                                {zipUploading ? 'Replacing…' : 'Replace Files'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
