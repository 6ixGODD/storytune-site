'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CmsFormProps, saveCmsSection } from './shared';

export function GalleryForm({ initialContent }: CmsFormProps<'home.gallery'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.gallery', content);
            setContent(updated);
            toast.success('Gallery content updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save gallery content');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between gap-4'>
                    <div>
                        <CardTitle>Gallery preview</CardTitle>
                        <CardDescription>Update the homepage gallery heading and footer link.</CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                    <Label htmlFor='gallery-eyebrow'>Eyebrow</Label>
                    <Input
                        id='gallery-eyebrow'
                        value={content.eyebrow}
                        onChange={(event) => setContent((current) => ({ ...current, eyebrow: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='gallery-heading'>Heading</Label>
                    <Input
                        id='gallery-heading'
                        value={content.heading}
                        onChange={(event) => setContent((current) => ({ ...current, heading: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='gallery-view-all-label'>View all label</Label>
                    <Input
                        id='gallery-view-all-label'
                        value={content.viewAllLabel}
                        onChange={(event) => setContent((current) => ({ ...current, viewAllLabel: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='gallery-view-all-href'>View all href</Label>
                    <Input
                        id='gallery-view-all-href'
                        value={content.viewAllHref}
                        onChange={(event) => setContent((current) => ({ ...current, viewAllHref: event.target.value }))}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
