import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { APP_CONFIG } from '@/config/app-config';
import { ClientPreview, EMAIL_CLIENTS } from '@/types';

/**
 * API route for getting preview data
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
      // Check if processing is complete
      const statusData = await getProcessingStatus(processId);
      
      if (statusData.status !== 'complete') {
        return NextResponse.json(
          { 
            error: 'Processing not complete',
            code: 'processing-incomplete',
            status: statusData.status
          },
          { status: 400 }
        );
      }
      
      // Get HTML code
      const htmlCode = await getHtmlCode(processId);
      
      // Get metadata
      const metadata = await getMetadata(processId);
      
      // Generate previews
      const previews = generatePreviews(metadata);
      
      // Generate text previews
      const textPreviews = generateTextPreviews(previews);
      
      return NextResponse.json({
        htmlCode,
        previews,
        textPreviews,
        metadata: metadata.metadata
      });
    } catch (error) {
      console.error('Preview retrieval error:', error);
      
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
          error: 'Failed to retrieve preview data',
          code: 'preview-retrieval-failed',
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
 * Get HTML code from temporary storage
 * @param processId Unique identifier for the process
 * @returns HTML code
 */
async function getHtmlCode(processId: string): Promise<string> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get HTML file path
  const htmlPath = path.join(tempDir, `${processId}.html`);
  
  // Read HTML file
  return fs.readFile(htmlPath, 'utf-8');
}

/**
 * Get metadata from temporary storage
 * @param processId Unique identifier for the process
 * @returns Metadata
 */
async function getMetadata(processId: string): Promise<any> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get metadata file path
  const metadataPath = path.join(tempDir, `${processId}.meta.json`);
  
  // Read metadata file
  const metadataStr = await fs.readFile(metadataPath, 'utf-8');
  return JSON.parse(metadataStr);
}

/**
 * Generate previews for email clients
 * @param metadata Processing metadata
 * @returns Array of client previews
 */
function generatePreviews(metadata: any): ClientPreview[] {
  // Get file types available
  const hasSvg = !!metadata.originalFile.type === 'svg';
  const hasVml = !!metadata.vmlCode;
  
  // Generate previews for each client
  return EMAIL_CLIENTS.slice(0, 3).map(client => {
    // Determine fallback type
    let fallbackUsed = client.preferredFallback;
    
    // If preferred fallback is not available, use PNG
    if (fallbackUsed === 'svg' && !hasSvg) {
      fallbackUsed = 'png';
    } else if (fallbackUsed === 'vml' && !hasVml) {
      fallbackUsed = 'png';
    }
    
    // Determine quality rating
    let estimatedQuality = 'excellent';
    if (fallbackUsed !== client.preferredFallback) {
      estimatedQuality = 'good';
    }
    
    // If using PNG for a client that prefers SVG or VML, quality is good
    if (fallbackUsed === 'png' && client.preferredFallback !== 'png') {
      estimatedQuality = 'good';
    }
    
    // Return preview
    return {
      client: client.id,
      fallbackUsed,
      estimatedQuality,
    } as ClientPreview;
  });
}

/**
 * Generate text previews for email clients
 * @param previews Client previews
 * @returns Array of text previews
 */
function generateTextPreviews(previews: ClientPreview[]): string[] {
  return previews.map(preview => {
    const client = EMAIL_CLIENTS.find(c => c.id === preview.client);
    if (!client) return '';
    
    let qualityText = '';
    switch (preview.estimatedQuality) {
      case 'excellent':
        qualityText = 'excellent quality';
        break;
      case 'good':
        qualityText = 'good quality';
        break;
      case 'fair':
        qualityText = 'fair quality';
        break;
      case 'poor':
        qualityText = 'reduced quality';
        break;
    }
    
    let fallbackText = '';
    switch (preview.fallbackUsed) {
      case 'svg':
        fallbackText = 'SVG vector format';
        break;
      case 'png':
        fallbackText = 'PNG raster format';
        break;
      case 'vml':
        fallbackText = 'VML vector format';
        break;
    }
    
    return `${client.name} (${client.marketShare}% market share): Will use ${fallbackText} with ${qualityText}`;
  });
}