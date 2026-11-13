import { NextResponse, type NextRequest } from 'next/server';
import { allowPreview } from './lib/preview-access';
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/db-preview') && !allowPreview(process.env.NODE_ENV, request.headers.get('host'), request.headers.has('forwarded') || ['x-forwarded-for', 'x-real-ip'].some(key => { const value = request.headers.get(key); return value !== null && !['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(value); }) || (request.headers.has('x-forwarded-host') && request.headers.get('x-forwarded-host') !== request.headers.get('host')))) {
    return new NextResponse('Preview is available on localhost in development only.', { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  // Native form POSTs need their same-origin Origin; no-referrer can turn it null.
  response.headers.set('Referrer-Policy', request.nextUrl.pathname.startsWith('/db-preview') ? 'no-referrer' : 'same-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  return response;
}
export const config = { matcher: ['/db-preview/:path*', '/login', '/admin/:path*', '/user/:path*', '/dashboard', '/unauthorized', '/api/auth/:path*'] };
