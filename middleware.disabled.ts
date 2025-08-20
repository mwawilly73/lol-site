// middleware.ts
// Rôle : Content-Security-Policy et quelques headers de sécurité.
// ⚠️ Quand tu activeras AdSense, on ajoutera les domaines google ads aux directives.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const csp = [
    `default-src 'self'`,
    `script-src 'self'`,               // ajoutera plus tard les domaines AdSense
    `style-src 'self' 'unsafe-inline'`,// inline pour Tailwind en dev (ok)
    `img-src 'self' data: blob:`,      // images locales + placeholders
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');

  res.headers.set('Content-Security-Policy', csp);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Frame-Options', 'DENY');
  return res;
}

export const config = { matcher: '/:path*' };
