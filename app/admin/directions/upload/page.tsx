'use client';

import { useRouter } from 'next/navigation';
import { DragEvent, SubmitEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

import { AdminShell } from '@/components/admin/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function DirectionsUploadPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    function acceptFile(file: File | null) {
        if (!file) return;
        if (!file.name.endsWith('.zip')) {
            setError('Only .zip files are accepted.');
            return;
        }
        setError('');
        setZipFile(file);
    }

    function onDragOver(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragging(true);
    }

    function onDragLeave() {
        setDragging(false);
    }

    function onDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault();
        setDragging(false);
        acceptFile(e.dataTransfer.files?.[0] ?? null);
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!zipFile) {
            setError('Please select or drop a ZIP file.');
            return;
        }
        setError('');
        setLoading(true);

        const form = e.currentTarget;
        const formData = new FormData(form);
        // Replace any file-input value with our tracked state file.
        formData.set('zip', zipFile);

        try {
            const res = await fetch('/api/admin/inspirations/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Direction uploaded!', {
                    description: `Slug: ${data.data.slug}`,
                });
                router.push('/admin/directions');
                router.refresh();
            } else {
                const details = data.details
                    ? Object.entries(data.details as Record<string, string[]>)
                          .map(([f, msgs]) => `${f}: ${msgs.join(', ')}`)
                          .join('; ')
                    : null;
                setError(details ?? data.error ?? 'Upload failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminShell title="Upload Direction">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Upload Direction</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Upload a ZIP dist package for a new direction.</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    ← Back
                </Button>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-5">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="title">Title *</Label>
                            <Input id="title" name="title" placeholder="Modern Floral Wedding" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="category">Category *</Label>
                            <Input id="category" name="category" placeholder="Wedding, Birthday, Corporate…" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="slug">
                                Slug{' '}
                                <span className="text-muted-foreground text-xs">(leave blank to auto-generate)</span>
                            </Label>
                            <Input id="slug" name="slug" placeholder="modern-floral-wedding" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="coverPath">
                                Cover Path *
                                <span className="text-muted-foreground text-xs ml-1">
                                    (relative path inside ZIP, e.g. assets/cover.jpg)
                                </span>
                            </Label>
                            <Input id="coverPath" name="coverPath" placeholder="assets/cover.jpg" required />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="tags">
                            Tags <span className="text-muted-foreground text-xs">(comma-separated)</span>
                        </Label>
                        <Input id="tags" name="tags" placeholder="floral, pastel, romantic" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            rows={3}
                            placeholder="A brief description of this direction…"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="preview"
                            name="preview"
                            value="true"
                            className="h-4 w-4 rounded border-input accent-primary"
                        />
                        <Label htmlFor="preview" className="cursor-pointer">
                            Feature on homepage preview grid
                        </Label>
                    </div>

                    {/* Drop zone */}
                    <div className="flex flex-col gap-1.5">
                        <Label>
                            ZIP File *{' '}
                            <span className="text-muted-foreground text-xs">
                                (index.html at root or inside a single subfolder)
                            </span>
                        </Label>
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => fileInputRef.current?.click()}
                            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={[
                                'flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors select-none',
                                dragging
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
                                    <p className="text-sm font-medium">Drop ZIP here or click to browse</p>
                                    <p className="text-xs">.zip only</p>
                                </>
                            )}
                        </div>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            className="sr-only"
                            onChange={(e) => acceptFile(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading || !zipFile}>
                            {loading ? 'Uploading…' : 'Upload Direction'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}

