'use client';

import { useRouter } from 'next/navigation';
import { SubmitEvent, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const form = e.currentTarget;
        const username = (form.elements.namedItem('username') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();
            if (data.success) {
                router.push('/admin');
            } else {
                setError(data.error ?? 'Login failed');
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className='min-h-screen flex items-center justify-center bg-muted/20'>
            <Card className='w-full max-w-sm shadow-xl border-border/60'>
                <CardHeader className='pb-2 pt-8 px-8'>
                    <CardTitle className='text-center text-lg'>Sign in</CardTitle>
                </CardHeader>
                <CardContent className='px-8 pb-8'>
                    <form onSubmit={handleSubmit} noValidate className='flex flex-col gap-5 mt-2'>
                        {error && (
                            <Alert variant='destructive'>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='username'>Username</Label>
                            <Input id='username' name='username' type='text' autoComplete='username' required aria-label="Username" />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <Label htmlFor='password'>Password</Label>
                            <Input
                                id='password'
                                name='password'
                                type='password'
                                autoComplete='current-password'
                                required
                                aria-label='Password'
                            />
                        </div>
                        <Button type='submit' disabled={loading} className='w-full mt-1'>
                            {loading ? 'Signing in…' : 'Sign in'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
