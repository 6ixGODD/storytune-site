import ClipReveal from '@/components/home/clip-reveal';
import Cta from '@/components/home/cta';
import GalleryPreview from '@/components/home/gallery-preview';
import Hero from '@/components/home/hero';
import Pricing from '@/components/home/pricing';
import Process from '@/components/home/process';
import ScrollVerb from '@/components/home/scroll-verb';
import TextReveal from '@/components/home/text-reveal';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';
import { siteContentService } from '@/lib/services/site-content.service';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
    const cms = await siteContentService.getAll();

    return (
        <>
            <Navbar content={cms.nav} />
            <main>
                <Hero content={cms['home.hero']} />
                <ScrollVerb content={cms['home.scroll_verb']} />
                <TextReveal content={cms['home.text_reveal']} />
                <ClipReveal content={cms['home.clip_reveal']} />
                <Pricing content={cms['home.pricing']} />
                <Process content={cms['home.process']} />
                <GalleryPreview content={cms['home.gallery']} />
                <Cta content={cms['home.cta']} />
            </main>
            <Footer />
        </>
    );
}
