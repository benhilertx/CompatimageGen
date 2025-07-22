import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { APP_CONFIG } from '@/config/app-config';
import { ProcessingStatusInfo, Warning } from '@/types';

/**
 * API route for getting processing status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    if (!processId) {
      return NextResponse.json(
        { 
          error: 'Missing processId',
          code: 'missing-processid'
        },
        { status: 400 }
      );
    }
    
    try {
      // Get status from temporary storage
      const statusData = await getProcessingStatus(processId);
      
      // Get warnings if processing is complete
      let warnings: Warning[] = [];
      if (statusData.status === 'complete') {
        warnings = await getProcessingWarnings(processId);
      }
      
      // Create status response
      const status: ProcessingStatusInfo = {
        step: statusData.status === 'complete' ? 'complete' : 
              statusData.status === 'error' ? 'error' : 
              statusData.status === 'processing' ? 'optimizing' : 'validating',
        progress: statusData.progress || 0,
        message: statusData.message || getDefaultMessage(statusData.status),
        error: statusData.error
      };
      
      return NextResponse.json({
        status,
        warnings,
        processId
      });
    } catch (error) {
      console.error('Status retrieval error:', error);
      
      // Check if file not found
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return NextResponse.json(
          { 
            error: 'Process not found',
            code: 'process-not-found',
            details: error.message
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to retrieve status',
          code: 'status-retrieval-failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Request error:', error);
    return NextResponse.json(
      { 
        error: 'Invalid request',
        code: 'invalid-request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}

/**
 * Get processing status from temporary storage
 * @param processId Unique identifier for the process
 * @returns Processing status
 */
async function getProcessingStatus(processId: string): Promise<{
  status: 'pending' | 'processing' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
  updatedAt: string;
}> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get status file path
  const statusPath = path.join(tempDir, `${processId}.status.json`);
  
  try {
    // Read status file
    const statusStr = await fs.readFile(statusPath, 'utf-8');
    return JSON.parse(statusStr);
  } catch (error) {
    // If file doesn't exist, return pending status
    if (error instanceof Error && error.message.includes('ENOENT')) {
      return {
        status: 'pending',
        progress: 0,
        updatedAt: new Date().toISOString()
      };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Get processing warnings from metadata
 * @param processId Unique identifier for the process
 * @returns Array of warnings
 */
async function getProcessingWarnings(processId: string): Promise<Warning[]> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get metadata file path
  const metadataPath = path.join(tempDir, `${processId}.meta.json`);
  
  try {
    // Read metadata file
    const metadataStr = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataStr);
    
    // Return warnings or empty array
    return metadata.warnings || [];
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

/**
 * Get default message for status
 * @param status Processing status
 * @returns Default message
 */
function getDefaultMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Waiting to start processing...';
    case 'processing':
      return 'Processing your file...';
    case 'complete':
      return 'Processing complete!';
    case 'error':
      return 'An error occurred during processing.';
    default:
      return 'Processing...';
  }
}