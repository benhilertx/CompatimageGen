import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import JSZip from 'jszip';
import { APP_CONFIG } from '@/config/app-config';

// Configure API route options
export const config = {
  api: {
    // Set response limit to 10MB for larger downloads
    responseLimit: '10mb',
  },
};

/**
 * API route for downloading processed files
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
      
      // Get metadata
      const metadata = await getMetadata(processId);
      
      // Create ZIP package
      const zipBuffer = await createZipPackage(processId, metadata);
      
      // Return ZIP file
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="email-logo-package.zip"`,
        },
      });
    } catch (error) {
      console.error('Download error:', error);
      
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
          error: 'Failed to generate download package',
          code: 'download-generation-failed',
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
 * Create ZIP package with all files
 * @param processId Unique identifier for the process
 * @param metadata Processing metadata
 * @returns ZIP file buffer
 */
async function createZipPackage(processId: string, metadata: any): Promise<Buffer> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Create new ZIP file
  const zip = new JSZip();
  
  // Add HTML snippet
  const htmlPath = path.join(tempDir, `${processId}.html`);
  const htmlContent = await fs.readFile(htmlPath, 'utf-8');
  zip.file('email-logo.html', htmlContent);
  
  // Add PNG fallback
  const pngPath = path.join(tempDir, `${processId}.png`);
  const pngContent = await fs.readFile(pngPath);
  zip.file('email-logo.png', pngContent);
  
  // Add SVG if available
  try {
    const svgPath = path.join(tempDir, `${processId}.svg`);
    const svgContent = await fs.readFile(svgPath, 'utf-8');
    zip.file('email-logo.svg', svgContent);
  } catch (error) {
    // SVG might not exist, ignore error
  }
  
  // Add VML if available
  try {
    const vmlPath = path.join(tempDir, `${processId}.vml`);
    const vmlContent = await fs.readFile(vmlPath, 'utf-8');
    zip.file('email-logo.vml', vmlContent);
  } catch (error) {
    // VML might not exist, ignore error
  }
  
  // Add README with instructions
  const readme = generateReadme(metadata);
  zip.file('README.md', readme);
  
  // Generate ZIP file
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: APP_CONFIG.output.zip.compression
    }
  });
}

/**
 * Generate README with instructions
 * @param metadata Processing metadata
 * @returns README content
 */
function generateReadme(metadata: any): string {
  return `# Email Logo Package

This package contains all the files needed to use your logo in email campaigns with maximum compatibility across email clients.

## Files Included

- \`email-logo.html\`: HTML code snippet with all fallbacks for email clients
- \`email-logo.png\`: PNG fallback image for clients that don't support SVG or VML
- \`email-logo.svg\`: SVG vector image (if original was SVG)
- \`email-logo.vml\`: VML code for Outlook Desktop (if conversion was possible)

## Usage Instructions

1. Copy the contents of \`email-logo.html\` into your email template
2. The HTML includes all necessary fallbacks for different email clients
3. No external hosting is required as all assets are embedded as data URIs

## Email Client Compatibility

- Apple Mail: Uses SVG for best quality
- Gmail: Uses PNG fallback
- Outlook Desktop: Uses VML for vector quality
- Other clients: Default to PNG fallback

## Original File Information

- Filename: ${metadata.originalFile.name}
- File size: ${formatFileSize(metadata.originalFile.size)}
- File type: ${metadata.originalFile.type.toUpperCase()}

## Processing Information

- Original size: ${formatFileSize(metadata.metadata.originalFileSize)}
- Optimized size: ${formatFileSize(metadata.metadata.optimizedFileSize)}
- Compression ratio: ${Math.round(metadata.metadata.compressionRatio * 100)}%
- Generated on: ${new Date(metadata.metadata.generatedAt).toLocaleString()}

## Support

This package was generated by CompatimageGen.
`;
}

/**
 * Format file size in human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}