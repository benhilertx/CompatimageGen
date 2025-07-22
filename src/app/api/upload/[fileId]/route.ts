import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { APP_CONFIG } from '@/config/app-config';
import os from 'os';

/**
 * GET endpoint to check file status
 * @param request The incoming request
 * @param params Route parameters containing fileId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  
  try {
    // Use system temp directory or configured directory
    const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
    
    // Check for metadata file
    const metadataPath = path.join(tempDir, `${fileId}.meta.json`);
    
    try {
      await fs.access(metadataPath);
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      
      return NextResponse.json({
        status: 'available',
        fileId,
        metadata
      });
    } catch (error) {
      return NextResponse.json(
        {
          status: 'not_found',
          error: 'File not found or expired',
          code: 'file-not-found'
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('File status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to check file status',
        code: 'status-check-failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to manually clean up a file
 * @param request The incoming request
 * @param params Route parameters containing fileId
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  const { fileId } = params;
  
  try {
    // Use system temp directory or configured directory
    const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
    
    // Find all files with this fileId prefix
    const files = await fs.readdir(tempDir);
    const matchingFiles = files.filter(file => file.startsWith(fileId));
    
    if (matchingFiles.length === 0) {
      return NextResponse.json(
        {
          status: 'not_found',
          error: 'File not found or already cleaned up',
          code: 'file-not-found'
        },
        { status: 404 }
      );
    }
    
    // Delete all matching files
    for (const file of matchingFiles) {
      await fs.unlink(path.join(tempDir, file));
    }
    
    return NextResponse.json({
      status: 'deleted',
      message: 'File cleaned up successfully',
      fileId
    });
  } catch (error) {
    console.error('File cleanup error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: 'Failed to clean up file',
        code: 'cleanup-failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}