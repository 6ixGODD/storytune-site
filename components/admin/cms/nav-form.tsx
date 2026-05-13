'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { CmsFormProps, saveCmsSection } from './shared';

export function NavForm({ initialContent }: CmsFormProps<'nav'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('nav', content);
            setContent(updated);
            toast.success('Navigation updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save navigation');
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h2 className='text-lg font-semibold'>Navigation links</h2>
                    <p className='text-sm text-muted-foreground'>Manage the main site navigation.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            {content.links.map((link, index) => (
                <Card key={`${link.id}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Link {index + 1}</CardTitle>
                                <CardDescription>Edit label, href, and stable ID.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        links: current.links.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='grid gap-4 md:grid-cols-3'>
                        <div className='space-y-2'>
                            <Label htmlFor={`nav-id-${index}`}>ID</Label>
                            <Input
                                id={`nav-id-${index}`}
                                value={link.id}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        links: current.links.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, id: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`nav-label-${index}`}>Label</Label>
                            <Input
                                id={`nav-label-${index}`}
                                value={link.label}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        links: current.links.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, label: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`nav-href-${index}`}>Href</Label>
                            <Input
                                id={`nav-href-${index}`}
                                value={link.href}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        links: current.links.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, href: event.target.value } : item,
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
                        links: [...current.links, { id: `nav-link-${current.links.length + 1}`, label: '', href: '' }],
                    }))
                }
            >
                Add link
            </Button>
        </div>
    );
}
