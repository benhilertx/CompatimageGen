import { NextRequest, NextResponse } from 'next/server';
import { FileValidator } from '@/lib/utils/file-validator';
import { APP_CONFIG } from '@/config/app-config';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { FileData, FileType } from '@/types';
import os from 'os';

/**
 * API route for file uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Check if request is multipart form data
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { 
          error: 'Request must be multipart/form-data',
          code: 'invalid-request-type'
        },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { 
          error: 'No file provided',
          code: 'missing-file'
        },
        { status: 400 }
      );
    }

    // Validate file
    const validationResult = await FileValidator.validateFile(file);
    if (!validationResult.valid) {
      return NextResponse.json(
        { 
          error: 'File validation failed',
          validationResult,
          code: 'validation-failed',
          details: validationResult.errors.join(', ')
        },
        { status: 400 }
      );
    }

    // Generate unique file ID
    const fileId = uuidv4();
    
    try {
      // Save file to temporary storage
      const filePath = await saveUploadedFile(file, fileId);
      
      // Create file data object
      const fileType = FileValidator.determineFileType(file);
      const fileData: FileData = {
        buffer: Buffer.from(await file.arrayBuffer()),
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        fileType: fileType as FileType
      };
      
      // Store file metadata in session or database (simplified for now)
      await storeFileMetadata(fileId, fileData);
      
      // Schedule cleanup of temporary files
      scheduleCleanup(filePath);
      
      return NextResponse.json({
        fileId,
        validationResult,
        message: 'File uploaded successfully',
        fileName: file.name,
        fileType,
        fileSize: file.size,
        tempPath: filePath
      });
    } catch (error) {
      console.error('File storage error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to store uploaded file',
          code: 'storage-failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'File upload failed',
        code: 'upload-failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Save uploaded file to temporary storage
 * @param file The file to save
 * @param fileId Unique identifier for the file
 * @returns Path to the saved file
 */
async function saveUploadedFile(file: File, fileId: string): Promise<string> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
  
  // Create temp directory if it doesn't exist
  await fs.mkdir(tempDir, { recursive: true });
  
  // Generate file path with original extension
  const extension = file.name.split('.').pop() || '';
  const filePath = path.join(tempDir, `${fileId}.${extension}`);
  
  // Convert File to Buffer and save
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  
  return filePath;
}

/**
 * Store file metadata for later retrieval
 * In a production app, this would use a database or Redis
 * For simplicity, we're using the filesystem
 * @param fileId Unique identifier for the file
 * @param fileData File data to store
 */
async function storeFileMetadata(fileId: string, fileData: FileData): Promise<void> {
  // Use system temp directory or configured directory
  const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
  const metadataPath = path.join(tempDir, `${fileId}.meta.json`);
  
  // Store everything except the buffer which could be large
  const metadata = {
    originalName: fileData.originalName,
    mimeType: fileData.mimeType,
    size: fileData.size,
    fileType: fileData.fileType,
    uploadedAt: new Date().toISOString()
  };
  
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Schedule cleanup of temporary files
 * In a production app, this would use a job queue or cron
 * For simplicity, we're using setTimeout
 * @param filePath Path to the file to clean up
 */
function scheduleCleanup(filePath: string): void {
  // Clean up after 1 hour (3600000 ms)
  setTimeout(async () => {
    try {
      // Check if file exists before attempting to delete
      await fs.access(filePath);
      await fs.unlink(filePath);
      
      // Also delete metadata file if it exists
      const metadataPath = filePath.replace(/\.[^.]+$/, '.meta.json');
      try {
        await fs.access(metadataPath);
        await fs.unlink(metadataPath);
      } catch (error) {
        // Metadata file might not exist, ignore error
      }
      
      console.log(`Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      // File might have been deleted already, ignore error
      console.log(`Failed to clean up temporary file: ${filePath}`, error);
    }
  }, 3600000);
}