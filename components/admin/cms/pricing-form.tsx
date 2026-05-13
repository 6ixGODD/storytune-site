'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { CmsFormProps, saveCmsSection } from './shared';

export function PricingForm({ initialContent }: CmsFormProps<'home.pricing'>) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    async function handleSave() {
        try {
            setIsSaving(true);
            const updated = await saveCmsSection('home.pricing', content);
            setContent(updated);
            toast.success('Pricing updated');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to save pricing');
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
                            <CardTitle>Pricing section</CardTitle>
                            <CardDescription>Manage pricing headings, Etsy link, and tier details.</CardDescription>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='grid gap-4 md:grid-cols-3'>
                    <div className='space-y-2'>
                        <Label htmlFor='pricing-eyebrow'>Eyebrow</Label>
                        <Input
                            id='pricing-eyebrow'
                            value={content.eyebrow}
                            onChange={(event) => setContent((current) => ({ ...current, eyebrow: event.target.value }))}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='pricing-heading'>Heading</Label>
                        <Input
                            id='pricing-heading'
                            value={content.heading}
                            onChange={(event) => setContent((current) => ({ ...current, heading: event.target.value }))}
                        />
                    </div>
                    <div className='space-y-2'>
                        <Label htmlFor='pricing-etsy-href'>Etsy href</Label>
                        <Input
                            id='pricing-etsy-href'
                            value={content.etsyHref}
                            onChange={(event) => setContent((current) => ({ ...current, etsyHref: event.target.value }))}
                        />
                    </div>
                </CardContent>
            </Card>

            {content.tiers.map((tier, index) => (
                <Card key={`${tier.id}-${index}`}>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <CardTitle>Tier {index + 1}</CardTitle>
                                <CardDescription>Displayed in the pricing toggle and detail card.</CardDescription>
                            </div>
                            <Button
                                type='button'
                                variant='destructive'
                                size='sm'
                                onClick={() =>
                                    setContent((current) => ({
                                        ...current,
                                        tiers: current.tiers.filter((_, itemIndex) => itemIndex !== index),
                                    }))
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid gap-4 md:grid-cols-3'>
                            <div className='space-y-2'>
                                <Label htmlFor={`pricing-tier-id-${index}`}>ID</Label>
                                <Input
                                    id={`pricing-tier-id-${index}`}
                                    value={tier.id}
                                    onChange={(event) =>
                                        setContent((current) => ({
                                            ...current,
                                            tiers: current.tiers.map((item, itemIndex) =>
                                                itemIndex === index ? { ...item, id: event.target.value } : item,
                                            ),
                                        }))
                                    }
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor={`pricing-tier-label-${index}`}>Label</Label>
                                <Input
                                    id={`pricing-tier-label-${index}`}
                                    value={tier.label}
                                    onChange={(event) =>
                                        setContent((current) => ({
                                            ...current,
                                            tiers: current.tiers.map((item, itemIndex) =>
                                                itemIndex === index ? { ...item, label: event.target.value } : item,
                                            ),
                                        }))
                                    }
                                />
                            </div>
                            <div className='space-y-2'>
                                <Label htmlFor={`pricing-tier-price-${index}`}>Price</Label>
                                <Input
                                    id={`pricing-tier-price-${index}`}
                                    value={tier.price}
                                    onChange={(event) =>
                                        setContent((current) => ({
                                            ...current,
                                            tiers: current.tiers.map((item, itemIndex) =>
                                                itemIndex === index ? { ...item, price: event.target.value } : item,
                                            ),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor={`pricing-tier-desc-${index}`}>Description</Label>
                            <Textarea
                                id={`pricing-tier-desc-${index}`}
                                rows={3}
                                value={tier.desc}
                                onChange={(event) =>
                                    setContent((current) => ({
                                        ...current,
                                        tiers: current.tiers.map((item, itemIndex) =>
                                            itemIndex === index ? { ...item, desc: event.target.value } : item,
                                        ),
                                    }))
                                }
                            />
                        </div>
                        <div className='space-y-3'>
                            <div className='flex items-center justify-between gap-4'>
                                <Label>Features</Label>
                                <Button
                                    type='button'
                                    variant='outline'
                                    size='sm'
                                    onClick={() =>
                                        setContent((current) => ({
                                            ...current,
                                            tiers: current.tiers.map((item, itemIndex) =>
                                                itemIndex === index
                                                    ? { ...item, features: [...item.features, ''] }
                                                    : item,
                                            ),
                                        }))
                                    }
                                >
                                    Add feature
                                </Button>
                            </div>
                            <div className='space-y-3'>
                                {tier.features.map((feature, featureIndex) => (
                                    <div key={`${featureIndex}-${feature}`} className='flex gap-2'>
                                        <Input
                                            value={feature}
                                            onChange={(event) =>
                                                setContent((current) => ({
                                                    ...current,
                                                    tiers: current.tiers.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  features: item.features.map((entry, entryIndex) =>
                                                                      entryIndex === featureIndex
                                                                          ? event.target.value
                                                                          : entry,
                                                                  ),
                                                              }
                                                            : item,
                                                    ),
                                                }))
                                            }
                                        />
                                        <Button
                                            type='button'
                                            variant='destructive'
                                            size='sm'
                                            onClick={() =>
                                                setContent((current) => ({
                                                    ...current,
                                                    tiers: current.tiers.map((item, itemIndex) =>
                                                        itemIndex === index
                                                            ? {
                                                                  ...item,
                                                                  features: item.features.filter(
                                                                      (_, entryIndex) => entryIndex !== featureIndex,
                                                                  ),
                                                              }
                                                            : item,
                                                    ),
                                                }))
                                            }
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
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
                        tiers: [...current.tiers, { id: '', label: '', price: '', desc: '', features: [''] }],
                    }))
                }
            >
                Add tier
            </Button>
        </div>
    );
}
