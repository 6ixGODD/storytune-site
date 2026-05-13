'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { CmsFormProps, saveCmsSection } from './shared';

export function HeroForm({ initialContent }: CmsFormProps<'home.hero'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.hero', content);
            setContent(updated);
            toast.success('Hero updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save hero content');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between gap-4'>
                    <div>
                        <CardTitle>Hero section</CardTitle>
                        <CardDescription>Update the homepage hero copy and action links.</CardDescription>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                    <Label htmlFor='hero-heading1'>Heading line 1</Label>
                    <Input
                        id='hero-heading1'
                        value={content.heading1}
                        onChange={(event) => setContent((current) => ({ ...current, heading1: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='hero-heading2'>Heading line 2</Label>
                    <Input
                        id='hero-heading2'
                        value={content.heading2}
                        onChange={(event) => setContent((current) => ({ ...current, heading2: event.target.value }))}
                    />
                </div>
                <div className='space-y-2 md:col-span-2'>
                    <Label htmlFor='hero-sub'>Subheading</Label>
                    <Textarea
                        id='hero-sub'
                        rows={3}
                        value={content.sub}
                        onChange={(event) => setContent((current) => ({ ...current, sub: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='hero-primary-label'>Primary button label</Label>
                    <Input
                        id='hero-primary-label'
                        value={content.primaryBtnLabel}
                        onChange={(event) =>
                            setContent((current) => ({ ...current, primaryBtnLabel: event.target.value }))
                        }
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='hero-primary-href'>Primary button href</Label>
                    <Input
                        id='hero-primary-href'
                        value={content.primaryBtnHref}
                        onChange={(event) => setContent((current) => ({ ...current, primaryBtnHref: event.target.value }))}
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='hero-secondary-label'>Secondary button label</Label>
                    <Input
                        id='hero-secondary-label'
                        value={content.secondaryBtnLabel}
                        onChange={(event) =>
                            setContent((current) => ({ ...current, secondaryBtnLabel: event.target.value }))
                        }
                    />
                </div>
                <div className='space-y-2'>
                    <Label htmlFor='hero-secondary-href'>Secondary button href</Label>
                    <Input
                        id='hero-secondary-href'
                        value={content.secondaryBtnHref}
                        onChange={(event) =>
                            setContent((current) => ({ ...current, secondaryBtnHref: event.target.value }))
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
