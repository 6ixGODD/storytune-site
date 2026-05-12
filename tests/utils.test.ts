import { describe, expect, it } from 'vitest';

import { cn } from '@/lib/utils';

describe('cn()', () => {
    it('returns a single class name unchanged', () => {
        expect(cn('foo')).toBe('foo');
    });

    it('merges multiple class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('deduplicates conflicting Tailwind classes (last wins)', () => {
        expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('handles conditional classes (falsy values are ignored)', () => {
        // eslint-disable-next-line no-constant-binary-expression
        expect(cn('foo', false && 'bar', null, undefined, 'baz')).toBe('foo baz');
    });

    it('handles object syntax', () => {
        expect(cn({ foo: true, bar: false })).toBe('foo');
    });

    it('handles array syntax', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar');
    });

    it('returns empty string when no arguments provided', () => {
        expect(cn()).toBe('');
    });
});
