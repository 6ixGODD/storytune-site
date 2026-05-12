import Cta from '@/components/home/cta';
import GalleryPreview from '@/components/home/gallery-preview';
import Hero from '@/components/home/hero';
import Pricing from '@/components/home/pricing';
import Process from '@/components/home/process';
import ScrollVerb from '@/components/home/scroll-verb';
import TextReveal from '@/components/home/text-reveal';
import Footer from '@/components/layout/footer';
import Navbar from '@/components/layout/navbar';

// GalleryPreview fetches from MongoDB; opt out of static generation.
export const dynamic = 'force-dynamic';

export default function HomePage() {
    return (
        <>
            <Navbar />
            <main>
                <Hero />
                <ScrollVerb />
                <TextReveal />
                <Pricing />
                <Process />
                <GalleryPreview />
                <Cta />
            </main>
            <Footer />
        </>
    );
}
