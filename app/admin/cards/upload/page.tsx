'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

import { AdminShell } from '@/components/admin/admin-shell';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function UploadPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/admin/cards/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(`Uploaded! Slug: ${data.data.slug} — ${data.data.cardUrl}`);
            } else {
                setError(data.error ?? 'Upload failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AdminShell title="Upload Card">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Upload Card</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Upload a ZIP dist package for a new invitation card.</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>← Back</Button>
            </div>

            <div className="max-w-2xl">
                <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-5">
                    {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                    {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="clientName">Client Name *</Label>
                            <Input id="clientName" name="clientName" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="clientEmail">Client Email *</Label>
                            <Input id="clientEmail" name="clientEmail" type="email" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="slug">Slug <span className="text-muted-foreground">(optional)</span></Label>
                            <Input id="slug" name="slug" placeholder="alice-wedding-2026" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="eventType">Event Type</Label>
                            <Input id="eventType" name="eventType" placeholder="Wedding, Birthday…" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="title">Card Title</Label>
                        <Input id="title" name="title" placeholder="Alice & Bob Wedding Invitation" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" name="notes" rows={3} />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="invitees">Invitees <span className="text-muted-foreground text-xs">(JSON array, optional)</span></Label>
                        <Textarea
                            id="invitees"
                            name="invitees"
                            rows={4}
                            className="font-mono text-xs"
                            placeholder={'[{"name": "John Doe", "email": "john@example.com"}]'}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="zip">ZIP File * <span className="text-muted-foreground text-xs">(must contain index.html at root)</span></Label>
                        <Input id="zip" name="zip" type="file" accept=".zip" required />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Uploading…' : 'Upload Card'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminShell>
    );
}