import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const sessionToken = request.cookies.get('session_token')?.value;

    if (sessionToken) {
        return NextResponse.redirect(new URL('/pages/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/register'],
};
