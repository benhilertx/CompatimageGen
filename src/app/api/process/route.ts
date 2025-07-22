import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { APP_CONFIG } from '@/config/app-config';
import { FileData, ProcessingOptions, ProcessingResult, ProcessingStatus } from '@/types';

// Configure API route options
export const config = {
  api: {
    // Set response limit to 4MB
    responseLimit: '4mb',
  },
};

/**
 * API route for processing uploaded files
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.fileId) {
      return NextResponse.json(
        { 
          error: 'Missing fileId',
          code: 'missing-fileid'
        },
        { status: 400 }
      );
    }
    
    if (!body.options) {
      return NextResponse.json(
        { 
          error: 'Missing options',
          code: 'missing-options'
        },
        { status: 400 }
      );
    }
    
    const { fileId, options } = body as { 
      fileId: string; 
      options: ProcessingOptions;
    };
    
    // Generate process ID
    const processId = uuidv4();
    
    try {
      // Get file metadata and content
      const fileData = await getFileData(fileId);
      
      // Process file
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Save processing results
      await saveProcessingResults(processId, result);
      
      // Return success response
      return NextResponse.json({
        processId,
        status: 'complete',
        message: 'File processed successfully',
        warnings: result.warnings
      });
    } catch (error) {
      console.error('Processing error:', error);
      
      // Check if file not found
      if (error instanceof Error && error.message.includes('ENOENT')) {
        return NextResponse.json(
          { 
            error: 'File not found',
            code: 'file-not-found',
            details: error.message
          },
          { status: 404 }
        );
      }
      
      // Save error status
      await saveProcessingStatus(processId, 'error', error instanceof Error ? error.message : 'Unknown error');
      
      return NextResponse.json(
        { 
          error: 'Failed to process file',
          code: 'processing-failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          processId,
          status: 'error'
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
 * Get file data from temporary storage
 * @param fileId Unique identifier for the file
 * @returns File data object
 */
async function getFileData(fileId: string): Promise<FileData> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
  
  // Get metadata
  const metadataPath = path.join(tempDir, `${fileId}.meta.json`);
  const metadataStr = await fs.readFile(metadataPath, 'utf-8');
  const metadata = JSON.parse(metadataStr);
  
  // Find file path by checking common extensions
  const extensions = ['svg', 'png', 'jpg', 'jpeg', 'css'];
  let filePath = '';
  let fileBuffer: Buffer | null = null;
  
  for (const ext of extensions) {
    const testPath = path.join(tempDir, `${fileId}.${ext}`);
    try {
      await fs.access(testPath);
      filePath = testPath;
      fileBuffer = await fs.readFile(testPath);
      break;
    } catch (error) {
      // File with this extension doesn't exist, try next
    }
  }
  
  if (!fileBuffer) {
    throw new Error(`File not found for ID: ${fileId}`);
  }
  
  // Return file data
  return {
    buffer: fileBuffer,
    originalName: metadata.originalName,
    mimeType: metadata.mimeType,
    size: metadata.size,
    fileType: metadata.fileType
  };
}

/**
 * Save processing results to temporary storage
 * @param processId Unique identifier for the process
 * @param result Processing result
 */
async function saveProcessingResults(processId: string, result: ProcessingResult): Promise<void> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Create temp directory if it doesn't exist
  await fs.mkdir(tempDir, { recursive: true });
  
  // Save status
  await saveProcessingStatus(processId, 'complete');
  
  // Save HTML snippet
  const htmlPath = path.join(tempDir, `${processId}.html`);
  await fs.writeFile(htmlPath, result.htmlSnippet);
  
  // Save PNG fallback
  const pngPath = path.join(tempDir, `${processId}.png`);
  await fs.writeFile(pngPath, result.pngFallback);
  
  // Save SVG if available
  if (result.optimizedSvg) {
    const svgPath = path.join(tempDir, `${processId}.svg`);
    await fs.writeFile(svgPath, result.optimizedSvg);
  }
  
  // Save VML if available
  if (result.vmlCode) {
    const vmlPath = path.join(tempDir, `${processId}.vml`);
    await fs.writeFile(vmlPath, result.vmlCode);
  }
  
  // Save metadata
  const metadataPath = path.join(tempDir, `${processId}.meta.json`);
  const metadata = {
    originalFile: {
      name: result.originalFile.originalName,
      size: result.originalFile.size,
      type: result.originalFile.fileType
    },
    warnings: result.warnings,
    metadata: result.metadata || {
      processingTime: 0,
      originalFileSize: result.originalFile.size,
      optimizedFileSize: result.optimizedSvg ? Buffer.from(result.optimizedSvg).length : 0,
      compressionRatio: 0,
      generatedAt: new Date().toISOString()
    },
    processedAt: new Date().toISOString()
  };
  
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Save processing status to temporary storage
 * @param processId Unique identifier for the process
 * @param status Processing status
 * @param error Error message if applicable
 */
async function saveProcessingStatus(processId: string, status: ProcessingStatus, error?: string): Promise<void> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.process.tempDir || path.join(os.tmpdir(), 'compatimage-results');
  
  // Create temp directory if it doesn't exist
  await fs.mkdir(tempDir, { recursive: true });
  
  // Save status
  const statusPath = path.join(tempDir, `${processId}.status.json`);
  const statusData = {
    status,
    updatedAt: new Date().toISOString(),
    error: error || null,
    progress: status === 'complete' ? 100 : status === 'error' ? 0 : 50
  };
  
  await fs.writeFile(statusPath, JSON.stringify(statusData, null, 2));
}