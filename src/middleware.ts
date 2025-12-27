import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register', '/api/auth'];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const sessionToken = request.cookies.get('session_token')?.value;

    // Check if the current path is a public path
    const isPublicPath = publicPaths.some((path) => pathname.startsWith(path)) || pathname === '/';

    // If the user is authenticated and trying to access a public path (like login),
    // redirect them to the dashboard
    if (sessionToken && isPublicPath && !pathname.startsWith('/api')) {
        return NextResponse.redirect(new URL('/pages/dashboard', request.url));
    }

    // If the user is NOT authenticated and trying to access a protected path,
    // redirect them to the login page
    if (!sessionToken && !isPublicPath) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public assets)
         */
        '/((?!_next/static|_next/image|favicon.ico|public).*)',
    ],
};
