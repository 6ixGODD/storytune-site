import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAME } from '@/lib/constants';

export async function POST() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_COOKIE_NAME);
    return Response.json({ success: true });
}
