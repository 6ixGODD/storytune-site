'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorInput } from '@/components/ui/color-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CmsFormProps, saveCmsSection } from './shared';

export function ScrollVerbForm({ initialContent }: CmsFormProps<'home.scroll_verb'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.scroll_verb', content);
            setContent(updated);
            toast.success('Scroll verbs updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save scroll verbs');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h2 className='text-lg font-semibold'>Scroll verbs</h2>
                    <p className='text-sm text-muted-foreground'>Edit the animated mobile verb list and prefix.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Prefix</CardTitle>
                    <CardDescription>Rendered before the animated verb list.</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                    <Label htmlFor='scroll-prefix'>Prefix</Label>
                    <Input
                        id='scroll-prefix'
                        value={content.prefix}
                        onChange={(event) => setContent((current) => ({ ...current, prefix: event.target.value }))}
                    />
                </CardContent>
            </Card>

            {content.verbs.map((verb, index) => (
                <Card key={`${verb.text}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Verb {index + 1}</CardTitle>
                                <CardDescription>Each verb supports its own text and HSL color.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        verbs: current.verbs.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                        <div className='space-y-2'>
                            <Label htmlFor={`verb-text-${index}`}>Text</Label>
                            <Input
                                id={`verb-text-${index}`}
                                value={verb.text}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        verbs: current.verbs.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, text: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`verb-color-${index}`}>Color</Label>
                            <ColorInput
                                id={`verb-color-${index}`}
                                value={verb.color}
                                onChange={(value) =>
                                    setContent((current) => ({
                                        ...current,
                                        verbs: current.verbs.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, color: value } : item,
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
                        verbs: [...current.verbs, { text: '', color: '' }],
                    }))
                }
            >
                Add verb
            </Button>
        </div>
    );
}
