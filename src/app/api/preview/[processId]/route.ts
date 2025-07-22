import { NextRequest, NextResponse } from 'next/server';
import { ClientPreview, ProcessingResult } from '@/types';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';

/**
 * GET /api/preview/:processId
 * Returns preview data for a processed file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params;
    
    // In a real implementation, you would fetch the processing result from a database or cache
    // For this demo, we'll create mock data
    const mockResult = getMockProcessingResult(processId);
    
    // Generate previews
    const previews = await PreviewGeneratorService.generateClientPreviews(mockResult);
    
    // Generate text previews
    const textPreviews = PreviewGeneratorService.generateTextPreviews(previews);
    
    // Return preview data
    return NextResponse.json({
      previews,
      textPreviews,
      htmlCode: mockResult.htmlSnippet
    });
  } catch (error) {
    console.error('Error generating previews:', error);
    return NextResponse.json(
      { error: 'Failed to generate previews' },
      { status: 500 }
    );
  }
}

/**
 * Mock function to get processing result
 * In a real implementation, this would fetch from a database or cache
 */
function getMockProcessingResult(processId: string): ProcessingResult {
  // This is a placeholder for demo purposes
  // In a real implementation, you would fetch the actual processing result
  return {
    originalFile: {
      buffer: Buffer.from('test'),
      originalName: 'logo.svg',
      mimeType: 'image/svg+xml',
      size: 1024,
      fileType: 'svg'
    },
    optimizedSvg: '<svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#0066cc" /></svg>',
    pngFallback: Buffer.from('mock-png-data'),
    vmlCode: '<v:oval style="width:200px;height:200px" fillcolor="#0066cc"></v:oval>',
    base64DataUri: 'data:image/png;base64,bW9jay1wbmctZGF0YQ==',
    htmlSnippet: `<!-- CompatimageGen Email Logo - Begin -->
<div style="max-width: 200px; margin: 0 auto;">
  <div style="height: 0; padding-bottom: 100%; position: relative;">
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
      <!--[if mso]>
      <v:oval style="width:200px;height:200px" fillcolor="#0066cc"></v:oval>
      <![endif]-->
      <!--[if !mso]><!-->
      <div style="display: block; width: 100%; height: 100%;">
        <svg width="200" height="200" viewBox="0 0 200 200" role="img" aria-label="Company Logo"><title>Company Logo</title><circle cx="100" cy="100" r="90" fill="#0066cc" /></svg>
      </div>
      <!--<![endif]-->
      <!--[if !vml]><!-->
      <img src="data:image/png;base64,bW9jay1wbmctZGF0YQ==" 
        width="200" 
        height="200" 
        alt="Company Logo" 
        style="display: block; width: 100%; height: auto; max-width: 100%;" 
        role="img" 
        aria-label="Company Logo">
      <!--<![endif]-->
    </div>
  </div>
</div>
<!-- CompatimageGen Email Logo - End -->`,
    warnings: [
      {
        type: 'svg-complexity',
        message: 'SVG is simple and should render well in all clients',
        severity: 'low'
      }
    ],
    metadata: {
      originalFileSize: 1024,
      optimizedFileSize: 512,
      compressionRatio: 0.5,
      processingTime: 250,
      generatedAt: new Date().toISOString()
    }
  };
}