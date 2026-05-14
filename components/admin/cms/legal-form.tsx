'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteContentKey, SiteContentMap } from '@/lib/entities/site-content';

import styles from './legal-form.module.scss';
import { saveCmsSection } from './shared';

interface LegalFormProps {
    contentKey: Extract<SiteContentKey, 'legal.privacy' | 'legal.terms'>;
    initialContent: SiteContentMap['legal.privacy'];
    label: string;
}

export function LegalForm({ contentKey, initialContent, label }: LegalFormProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection(contentKey, content);
            setContent(updated);
            toast.success(`${label} updated`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Failed to save ${label}`);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className='space-y-4'>
            <div className='flex items-center justify-between gap-4'>
                <div>
                    <h2 className='text-lg font-semibold'>{label}</h2>
                    <p className='text-sm text-muted-foreground'>Edit the page content using Markdown.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving…' : 'Save'}
                </Button>
            </div>

            <Tabs defaultValue='edit' className='gap-3'>
                <TabsList className='h-auto rounded-md bg-muted p-1'>
                    <TabsTrigger value='edit'>Edit</TabsTrigger>
                    <TabsTrigger value='preview'>Preview</TabsTrigger>
                </TabsList>

                <TabsContent value='edit' className='mt-0'>
                    <div className='space-y-2'>
                        <Label htmlFor={`${contentKey}-markdown`}>Markdown</Label>
                        <textarea
                            id={`${contentKey}-markdown`}
                            className='w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                            rows={32}
                            value={content.markdown}
                            onChange={(e) => setContent({ markdown: e.target.value })}
                            spellCheck={false}
                        />
                    </div>
                </TabsContent>

                <TabsContent value='preview' className='mt-0'>
                    <div className='min-h-48 rounded-md border border-input bg-muted/30 px-6 py-5'>
                        <div className={styles.preview}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content.markdown}</ReactMarkdown>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
