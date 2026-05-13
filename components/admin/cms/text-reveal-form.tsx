'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CmsFormProps, saveCmsSection } from './shared';

export function TextRevealForm({ initialContent }: CmsFormProps<'home.text_reveal'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.text_reveal', content);
            setContent(updated);
            toast.success('Taglines updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save taglines');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h2 className='text-lg font-semibold'>Text reveal taglines</h2>
                    <p className='text-sm text-muted-foreground'>Manage the large scroll-based headline sequence.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            {content.taglines.map((tagline, index) => (
                <Card key={`${tagline}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Tagline {index + 1}</CardTitle>
                                <CardDescription>Each item appears in sequence on scroll.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        taglines: current.taglines.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        <Label htmlFor={`tagline-${index}`}>Text</Label>
                        <Input
                            id={`tagline-${index}`}
                            value={tagline}
                            onChange={(event) =>
                                setContent((current) => ({
                                    ...current,
                                    taglines: current.taglines.map((item, itemIndex) =>
                                        itemIndex === index ? event.target.value : item,
                                    ),
                                }))
                            }
                        />
                    </CardContent>
                </Card>
            ))}

            <Button
                type='button'
                variant='outline'
                onClick={() =>
                    setContent((current) => ({
                        ...current,
                        taglines: [...current.taglines, ''],
                    }))
                }
            >
                Add tagline
            </Button>
        </div>
    );
}
