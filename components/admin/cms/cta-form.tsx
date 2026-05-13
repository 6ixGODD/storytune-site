'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { CmsFormProps, saveCmsSection } from './shared';

export function CtaForm({ initialContent }: CmsFormProps<'home.cta'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.cta', content);
            setContent(updated);
            toast.success('CTA updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save CTA content');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between gap-4'>
                    <div>
                        <CardTitle>Call to action</CardTitle>
                        <CardDescription>Control the closing CTA copy and button link.</CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                    <Label htmlFor='cta-heading1'>Heading line 1</Label>
                    <Input
                        id='cta-heading1'
                        value={content.heading1}
                        onChange={(event) => setContent((current) => ({ ...current, heading1: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='cta-heading2'>Heading line 2</Label>
                    <Input
                        id='cta-heading2'
                        value={content.heading2}
                        onChange={(event) => setContent((current) => ({ ...current, heading2: event.target.value }))}
                    />
                </div>
                <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='cta-sub'>Body copy</Label>
                    <Textarea
                        id='cta-sub'
                        rows={4}
                        value={content.sub}
                        onChange={(event) => setContent((current) => ({ ...current, sub: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='cta-btn-label'>Button label</Label>
                    <Input
                        id='cta-btn-label'
                        value={content.btnLabel}
                        onChange={(event) => setContent((current) => ({ ...current, btnLabel: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='cta-btn-href'>Button href</Label>
                    <Input
                        id='cta-btn-href'
                        value={content.btnHref}
                        onChange={(event) => setContent((current) => ({ ...current, btnHref: event.target.value }))}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
