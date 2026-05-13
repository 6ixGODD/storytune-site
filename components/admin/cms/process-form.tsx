'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { CmsFormProps, saveCmsSection } from './shared';

export function ProcessForm({ initialContent }: CmsFormProps<'home.process'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.process', content);
            setContent(updated);
            toast.success('Process content updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save process content');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between gap-4'>
                        <div>
                            <CardTitle>Process section</CardTitle>
                            <CardDescription>Update the process heading and accordion steps.</CardDescription>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-2'>
                    <div className='space-y-2'>
                        <Label htmlFor='process-eyebrow'>Eyebrow</Label>
                        <Input
                            id='process-eyebrow'
                            value={content.eyebrow}
                            onChange={(event) => setContent((current) => ({ ...current, eyebrow: event.target.value }))}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='process-heading'>Heading</Label>
                        <Input
                            id='process-heading'
                            value={content.heading}
                            onChange={(event) => setContent((current) => ({ ...current, heading: event.target.value }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {content.steps.map((step, index) => (
                <Card key={`${step.id}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Step {index + 1}</CardTitle>
                                <CardDescription>Shown in both the accordion and timeline.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        steps: current.steps.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-2'>
                        <div className='space-y-2'>
                            <Label htmlFor={`process-step-id-${index}`}>Step ID</Label>
                            <Input
                                id={`process-step-id-${index}`}
                                value={step.id}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        steps: current.steps.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, id: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`process-step-title-${index}`}>Title</Label>
                            <Input
                                id={`process-step-title-${index}`}
                                value={step.title}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        steps: current.steps.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, title: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2 md:col-span-2'>
                            <Label htmlFor={`process-step-body-${index}`}>Body</Label>
                            <Textarea
                                id={`process-step-body-${index}`}
                                rows={4}
                                value={step.body}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        steps: current.steps.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, body: event.target.value } : item,
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
                        steps: [...current.steps, { id: '', title: '', body: '' }],
                    }))
                }
            >
                Add step
            </Button>
        </div>
    );
}
