'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorInput } from '@/components/ui/color-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CmsFormProps, saveCmsSection } from './shared';

export function ClipRevealForm({ initialContent }: CmsFormProps<'home.clip_reveal'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.clip_reveal', content);
            setContent(updated);
            toast.success('Clip reveal rows updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save clip reveal rows');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h2 className='text-lg font-semibold'>Clip reveal rows</h2>
                    <p className='text-sm text-muted-foreground'>Manage the hover-reveal lines on the homepage.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            {content.rows.map((row, index) => (
                <Card key={`${row.primary}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Row {index + 1}</CardTitle>
                                <CardDescription>Primary text, hover text, and hover colors.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        rows: current.rows.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                        <div className='space-y-2'>
                            <Label htmlFor={`clip-primary-${index}`}>Primary text</Label>
                            <Input
                                id={`clip-primary-${index}`}
                                value={row.primary}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        rows: current.rows.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, primary: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`clip-hover-${index}`}>Hover text</Label>
                            <Input
                                id={`clip-hover-${index}`}
                                value={row.hover}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        rows: current.rows.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, hover: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`clip-hover-bg-${index}`}>Hover background</Label>
                            <ColorInput
                                id={`clip-hover-bg-${index}`}
                                value={row.hoverBg}
                                onChange={(value) =>
                                    setContent((current) => ({
                                        ...current,
                                        rows: current.rows.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, hoverBg: value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`clip-hover-color-${index}`}>Hover text color</Label>
                            <ColorInput
                                id={`clip-hover-color-${index}`}
                                value={row.hoverColor}
                                onChange={(value) =>
                                    setContent((current) => ({
                                        ...current,
                                        rows: current.rows.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, hoverColor: value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button
                type='button'
                variant='outline'
                onClick={() =>
                    setContent((current) => ({
                        ...current,
                        rows: [...current.rows, { primary: '', hover: '', hoverBg: '', hoverColor: '' }],
                    }))
                }
            >
                Add row
            </Button>
        </div>
    );
}
