'use client';

import { DownloadIcon, QrCodeIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ColorInput } from '@/components/ui/color-input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';
type DotStyle = 'square' | 'dots' | 'rounded' | 'extra-rounded' | 'classy' | 'classy-rounded';

const ERROR_LEVELS: { value: ErrorLevel; label: string; title: string }[] = [
    { value: 'L', label: 'L', title: 'Low — 7 % recovery' },
    { value: 'M', label: 'M', title: 'Medium — 15 % recovery' },
    { value: 'Q', label: 'Q', title: 'Quartile — 25 % recovery' },
    { value: 'H', label: 'H', title: 'High — 30 % recovery' },
];

const DOT_STYLES: { value: DotStyle; label: string }[] = [
    { value: 'square', label: 'Square' },
    { value: 'dots', label: 'Dots' },
    { value: 'rounded', label: 'Rounded' },
    { value: 'extra-rounded', label: 'Extra Round' },
    { value: 'classy', label: 'Classy' },
    { value: 'classy-rounded', label: 'Classy Round' },
];

interface QrCodePanelProps {
    slug: string;
    /** Relative or absolute URL to encode.  If relative, window.location.origin is prepended. */
    cardUrl: string;
}

export function QrCodePanel({ slug, cardUrl }: QrCodePanelProps) {
    const [open, setOpen] = useState(false);
    const [errorLevel, setErrorLevel] = useState<ErrorLevel>('M');
    const [dotStyle, setDotStyle] = useState<DotStyle>('square');
    const [fgColor, setFgColor] = useState('#000000');
    const [bgColor, setBgColor] = useState('#ffffff');

    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qrRef = useRef<any>(null);

    useEffect(() => {
        if (!open) {
            qrRef.current = null;
            return;
        }

        const fullUrl = cardUrl.startsWith('http') ? cardUrl : `${window.location.origin}${cardUrl}`;

        let alive = true;

        async function render() {
            const { default: QRCodeStyling } = await import('qr-code-styling');
            if (!alive || !containerRef.current) return;

            const instance = new QRCodeStyling({
                width: 280,
                height: 280,
                type: 'canvas',
                data: fullUrl,
                dotsOptions: { color: fgColor, type: dotStyle },
                backgroundOptions: { color: bgColor },
                qrOptions: { errorCorrectionLevel: errorLevel },
            });

            containerRef.current.innerHTML = '';
            instance.append(containerRef.current);
            qrRef.current = instance;
        }

        render();
        return () => {
            alive = false;
        };
    }, [open, cardUrl, errorLevel, dotStyle, fgColor, bgColor]);

    async function handleDownload() {
        if (!qrRef.current) return;
        await qrRef.current.download({ name: `qr-${slug}`, extension: 'png' });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant='outline' size='sm'>
                    <QrCodeIcon className='size-3.5' />
                    QR Code
                </Button>
            </DialogTrigger>

            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>
                        QR Code —{' '}
                        <span className='font-mono text-sm font-normal text-muted-foreground'>{slug}</span>
                    </DialogTitle>
                    <DialogDescription>Customise and download a QR code for this card&apos;s link.</DialogDescription>
                </DialogHeader>

                <div className='flex flex-col gap-4'>
                    {/* Preview */}
                    <div className='flex justify-center rounded-lg border bg-muted/20 p-4'>
                        <div ref={containerRef} />
                    </div>

                    {/* Error correction level */}
                    <div className='space-y-1.5'>
                        <Label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                            Error Correction
                        </Label>
                        <div className='flex gap-1'>
                            {ERROR_LEVELS.map(({ value, label, title }) => (
                                <Button
                                    key={value}
                                    type='button'
                                    variant={errorLevel === value ? 'default' : 'outline'}
                                    size='sm'
                                    className='flex-1'
                                    title={title}
                                    onClick={() => setErrorLevel(value)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Dot style */}
                    <div className='space-y-1.5'>
                        <Label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                            Dot Style
                        </Label>
                        <div className='grid grid-cols-3 gap-1'>
                            {DOT_STYLES.map(({ value, label }) => (
                                <Button
                                    key={value}
                                    type='button'
                                    variant={dotStyle === value ? 'default' : 'outline'}
                                    size='sm'
                                    onClick={() => setDotStyle(value)}
                                >
                                    {label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Colours */}
                    <div className='grid grid-cols-2 gap-3'>
                        <div className='space-y-1.5'>
                            <Label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                                Foreground
                            </Label>
                            <ColorInput value={fgColor} onChange={setFgColor} />
                        </div>
                        <div className='space-y-1.5'>
                            <Label className='text-xs font-medium text-muted-foreground uppercase tracking-wide'>
                                Background
                            </Label>
                            <ColorInput value={bgColor} onChange={setBgColor} />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleDownload}>
                        <DownloadIcon className='size-4' />
                        Download PNG
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
