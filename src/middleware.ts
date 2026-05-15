import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/chat', '/career-hub', '/scheduling'];
// Admin-only protected routes
const adminRoutes = ['/admin'];

/** Decode the role from a JWT without verifying the signature (edge-safe, no Buffer). */
function getRoleFromToken(token: string): string | null {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;
        // Normalise base64url → base64, then decode (atob is available in Edge Runtime)
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        const json = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        const decoded = JSON.parse(json);
        return decoded.role ?? null;
    } catch {
        return null;
    }
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('token')?.value;

    // --- Admin routes: must be logged in AND be an admin ---
    const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
    if (isAdminRoute) {
        if (!token) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        const role = getRoleFromToken(token);
        if (role !== 'admin') {
            // Logged in but not an admin — send to their dashboard
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    // --- Student protected routes: must be logged in ---
    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
    if (isProtectedRoute) {
        if (!token) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }

    // --- Landing / Login: redirect authenticated users to their home ---
    if (pathname === '/' || pathname === '/login') {
        if (token) {
            const role = getRoleFromToken(token);
            const destination = role === 'admin' ? '/admin' : '/dashboard';
            return NextResponse.redirect(new URL(destination, request.url));
        }
    }

    return NextResponse.next();
}

// Configure which routes this middleware should run on
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
