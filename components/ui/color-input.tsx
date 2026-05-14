'use client';

import { useId } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ColorInputProps {
    value: string;
    onChange: (value: string) => void;
    id?: string;
    className?: string;
}

/**
 * A colour editor combining a native colour-picker swatch with a free-form text
 * input. The swatch accepts any CSS colour string for preview; the picker writes
 * hex values. Users may still type hsl/rgb/named colours in the text field.
 */
export function ColorInput({ value, onChange, id: externalId, className }: ColorInputProps) {
    const internalId = useId();
    const id = externalId ?? internalId;
    const pickerId = `${id}-picker`;

    // Native <input type="color"> only understands #rrggbb; fall back to black for
    // other formats so the picker still opens without a console error.
    const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

    return (
        <div className={cn('flex items-center gap-2', className)}>
            {/* Swatch / picker trigger */}
            <label
                htmlFor={pickerId}
                className='relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-md border border-input shadow-xs transition-opacity hover:opacity-80'
                style={{ backgroundColor: value || 'transparent' }}
                title='Click to open colour picker'
            >
                {!value && (
                    <span className='absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground select-none'>
                        ?
                    </span>
                )}
                <input
                    id={pickerId}
                    type='color'
                    value={pickerValue}
                    onChange={(e) => onChange(e.target.value)}
                    className='absolute inset-0 size-full cursor-pointer opacity-0'
                    tabIndex={-1}
                />
            </label>

            {/* Free-form text input */}
            <Input
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder='#000000 or hsl(0 0% 0%)'
                className='font-mono text-xs'
            />
        </div>
    );
}
