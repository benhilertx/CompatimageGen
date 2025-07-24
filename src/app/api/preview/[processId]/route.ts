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
  // Extract processId from the URL
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const processId = pathParts[pathParts.length - 1];
  
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
    
    // Generate simple previews
    const previews = generateSimplePreviews();
    
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
}

/**
 * Get processing status from temporary storage
 */
async function getProcessingStatus(processId: string) {
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
 */
async function getHtmlCode(processId: string) {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get HTML file path
  const htmlPath = path.join(tempDir, `${processId}.html`);
  
  // Read HTML file
  return fs.readFile(htmlPath, 'utf-8');
}

/**
 * Get metadata from temporary storage
 */
async function getMetadata(processId: string) {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Get metadata file path
  const metadataPath = path.join(tempDir, `${processId}.meta.json`);
  
  // Read metadata file
  const metadataStr = await fs.readFile(metadataPath, 'utf-8');
  return JSON.parse(metadataStr);
}

/**
 * Generate simple previews for email clients
 */
function generateSimplePreviews() {
  // Generate previews for each client
  return EMAIL_CLIENTS.slice(0, 3).map(client => {
    // Create simple HTML preview
    const htmlPreview = `
      <div style="border: 1px solid #ddd; border-radius: 4px; overflow: hidden;">
        <div style="background-color: #f5f5f5; padding: 8px; border-bottom: 1px solid #ddd;">
          ${client.name}
        </div>
        <div style="padding: 16px; display: flex; justify-content: center; align-items: center; min-height: 100px;">
          <div style="width: 200px; height: 100px; background-color: #3498db; display: flex; justify-content: center; align-items: center; color: white; font-weight: bold; border-radius: 4px;">
            ${client.preferredFallback.toUpperCase()} Preview
          </div>
        </div>
      </div>
    `;
    
    // Create simple CSS
    const clientStyles = `
      body {
        font-family: sans-serif;
        margin: 0;
        padding: 0;
      }
    `;
    
    // Return preview
    return {
      client: client.id,
      fallbackUsed: client.preferredFallback,
      estimatedQuality: 'good',
      htmlPreview,
      clientStyles
    };
  });
}

/**
 * Generate text previews for email clients
 */
function generateTextPreviews(previews) {
  return previews.map(preview => {
    const client = EMAIL_CLIENTS.find(c => c.id === preview.client);
    if (!client) return '';
    
    return `${client.name} (${client.marketShare}% market share): Will use ${preview.fallbackUsed} format with ${preview.estimatedQuality} quality`;
  });
}