'use client';

import { CheckIcon, CopyIcon, LinkIcon } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyButtonProps {
    /** The text to place on the clipboard when clicked. */
    text: string;
    /** Tooltip label shown before copying. */
    label?: string;
    /** Tooltip label shown after a successful copy (shown for 2 s). */
    successLabel?: string;
    /** Icon variant: 'copy' (default) shows a document icon; 'link' shows a chain-link icon. */
    icon?: 'copy' | 'link';
}

export function CopyButton({ text, label = 'Copy', successLabel = 'Copied!', icon = 'copy' }: CopyButtonProps) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        try {
            const value = text.startsWith('/') ? `${window.location.origin}${text}` : text;
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API may be blocked in insecure contexts — fail silently.
        }
    }

    const Icon = copied ? CheckIcon : icon === 'link' ? LinkIcon : CopyIcon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        type='button'
                        variant='ghost'
                        size='icon-sm'
                        onClick={handleCopy}
                        aria-label={copied ? successLabel : label}
                    >
                        <Icon className={copied ? 'size-3.5 text-green-500' : 'size-3.5'} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? successLabel : label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
