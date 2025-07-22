import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { FileCleanup } from './lib/utils/file-cleanup';
import { APP_CONFIG } from './config/app-config';

// Initialize cleanup process
let cleanupInterval: NodeJS.Timeout | null = null;

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Initialize cleanup process if not already running
  if (!cleanupInterval && typeof window === 'undefined') {
    // Only run on server-side
    cleanupInterval = FileCleanup.schedulePeriodicCleanup(
      APP_CONFIG.upload.cleanupInterval,
      APP_CONFIG.upload.tempFileExpiry
    );
    console.log('Initialized periodic file cleanup process');
  }
  
  // Continue with the request
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};