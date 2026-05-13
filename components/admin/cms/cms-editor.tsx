'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiteContentMap } from '@/lib/entities/site-content';

import { ClipRevealForm } from './clip-reveal-form';
import { CtaForm } from './cta-form';
import { GalleryForm } from './gallery-form';
import { HeroForm } from './hero-form';
import { NavForm } from './nav-form';
import { PricingForm } from './pricing-form';
import { ProcessForm } from './process-form';
import { ScrollVerbForm } from './scroll-verb-form';
import { TextRevealForm } from './text-reveal-form';

interface CmsEditorProps {
    content: SiteContentMap;
}

export function CmsEditor({ content }: CmsEditorProps) {
    return (
        <Tabs defaultValue='navigation' className='gap-6'>
            <TabsList className='h-auto flex-wrap justify-start gap-1 rounded-lg bg-muted p-1'>
                <TabsTrigger value='navigation'>Navigation</TabsTrigger>
                <TabsTrigger value='hero'>Hero</TabsTrigger>
                <TabsTrigger value='cta'>CTA</TabsTrigger>
                <TabsTrigger value='clip-reveal'>Clip Reveal</TabsTrigger>
                <TabsTrigger value='taglines'>Taglines</TabsTrigger>
                <TabsTrigger value='scroll-verbs'>Scroll Verbs</TabsTrigger>
                <TabsTrigger value='pricing'>Pricing</TabsTrigger>
                <TabsTrigger value='process'>Process</TabsTrigger>
                <TabsTrigger value='gallery'>Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value='navigation'>
                <NavForm initialContent={content.nav} />
            </TabsContent>
            <TabsContent value='hero'>
                <HeroForm initialContent={content['home.hero']} />
            </TabsContent>
            <TabsContent value='cta'>
                <CtaForm initialContent={content['home.cta']} />
            </TabsContent>
            <TabsContent value='clip-reveal'>
                <ClipRevealForm initialContent={content['home.clip_reveal']} />
            </TabsContent>
            <TabsContent value='taglines'>
                <TextRevealForm initialContent={content['home.text_reveal']} />
            </TabsContent>
            <TabsContent value='scroll-verbs'>
                <ScrollVerbForm initialContent={content['home.scroll_verb']} />
            </TabsContent>
            <TabsContent value='pricing'>
                <PricingForm initialContent={content['home.pricing']} />
            </TabsContent>
            <TabsContent value='process'>
                <ProcessForm initialContent={content['home.process']} />
            </TabsContent>
            <TabsContent value='gallery'>
                <GalleryForm initialContent={content['home.gallery']} />
            </TabsContent>
        </Tabs>
    );
}
