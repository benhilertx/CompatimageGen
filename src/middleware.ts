import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // We'll handle file cleanup in the API routes instead of middleware
  // since middleware runs in the Edge Runtime which doesn't support Node.js modules
  
  // Continue with the request
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};