import { NextRequest, NextResponse } from 'next/server';
import { PackageGeneratorService } from '@/lib/services/package-generator-service';
import APP_CONFIG from '@/config/app-config';
import { ClientPreview, PackageData, ProcessingResult } from '@/types';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';

/**
 * API endpoint for downloading a ZIP package with all generated files
 * @param request Next.js request
 * @param params Route parameters containing processId
 * @returns Response with ZIP file or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    // In a real implementation, you would fetch the processing result from a database or cache
    // For this example, we'll simulate a processing result
    const processingResult = await fetchProcessingResult(processId);
    
    if (!processingResult) {
      return NextResponse.json(
        { error: 'Processing result not found' },
        { status: 404 }
      );
    }
    
    // Generate client previews if they don't exist
    let previews: ClientPreview[] = [];
    try {
      previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
    } catch (error) {
      console.error('Error generating previews:', error);
      // Continue with empty previews if generation fails
    }
    
    // Create package data
    const packageData: PackageData = {
      htmlSnippet: processingResult.htmlSnippet,
      pngFile: processingResult.pngFallback,
      instructions: PackageGeneratorService.generateDefaultInstructions(),
      previews,
      metadata: processingResult.metadata
    };
    
    // Generate ZIP package
    const zipBuffer = await PackageGeneratorService.generatePackage(packageData);
    
    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="${APP_CONFIG.output.zip.filename}"`);
    
    // Return ZIP file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Error generating package:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate package' },
      { status: 500 }
    );
  }
}

/**
 * Fetch processing result from database or cache
 * @param processId Process ID
 * @returns Processing result or null if not found
 */
async function fetchProcessingResult(processId: string): Promise<ProcessingResult | null> {
  // In a real implementation, you would fetch this from a database or cache
  // For this example, we'll return a mock result
  
  // This is just a placeholder - in a real app, you would implement actual data retrieval
  if (processId === 'test-process-id') {
    return {
      originalFile: {
        buffer: Buffer.from('test-file-data'),
        originalName: 'logo.svg',
        mimeType: 'image/svg+xml',
        size: 15000,
        fileType: 'svg'
      },
      optimizedSvg: '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="50" fill="blue"/></svg>',
      pngFallback: Buffer.from('test-png-data'),
      vmlCode: '<v:oval style="width:100px;height:100px" fillcolor="blue"></v:oval>',
      base64DataUri: 'data:image/png;base64,dGVzdC1wbmctZGF0YQ==',
      htmlSnippet: '<div>Test HTML snippet with fallbacks</div>',
      warnings: [],
      metadata: {
        originalFileSize: 15000,
        optimizedFileSize: 8000,
        compressionRatio: 1.875,
        processingTime: 350,
        generatedAt: new Date().toISOString()
      }
    };
  }
  
  return null;
}