import { GET } from '../route';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';
import { NextRequest } from 'next/server';

// Mock the PreviewGeneratorService
jest.mock('@/lib/services/preview-generator-service', () => ({
  PreviewGeneratorService: {
    generateClientPreviews: jest.fn().mockResolvedValue([
      {
        client: 'apple-mail',
        fallbackUsed: 'svg',
        estimatedQuality: 'excellent',
        previewImage: Buffer.from('mock-image-data')
      },
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('mock-image-data')
      },
      {
        client: 'outlook-desktop',
        fallbackUsed: 'vml',
        estimatedQuality: 'fair',
        previewImage: Buffer.from('mock-image-data')
      }
    ]),
    generateTextPreviews: jest.fn().mockReturnValue([
      'Apple Mail: Will use SVG vector format with excellent rendering quality.',
      'Gmail: Will use PNG raster format with good rendering quality.',
      'Outlook Desktop: Will use VML vector format with fair rendering quality.'
    ])
  }
}));

describe('Preview API Route', () => {
  it('should return preview data for a valid process ID', async () => {
    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/preview/test-process-id');
    
    // Call the API handler
    const response = await GET(request, { params: { processId: 'test-process-id' } });
    const data = await response.json();
    
    // Check if response contains expected data
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('previews');
    expect(data).toHaveProperty('textPreviews');
    expect(data).toHaveProperty('htmlCode');
    
    // Check if preview data is correct
    expect(data.previews).toHaveLength(3);
    expect(data.textPreviews).toHaveLength(3);
    expect(data.htmlCode).toContain('CompatimageGen Email Logo');
    
    // Verify service was called with correct parameters
    expect(PreviewGeneratorService.generateClientPreviews).toHaveBeenCalled();
    expect(PreviewGeneratorService.generateTextPreviews).toHaveBeenCalled();
  });

  it('should handle errors and return 500 status', async () => {
    // Mock service to throw an error
    (PreviewGeneratorService.generateClientPreviews as jest.Mock).mockRejectedValueOnce(
      new Error('Test error')
    );
    
    // Create mock request
    const request = new NextRequest('http://localhost:3000/api/preview/error-process-id');
    
    // Call the API handler
    const response = await GET(request, { params: { processId: 'error-process-id' } });
    const data = await response.json();
    
    // Check if response contains error
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to generate previews');
  });
});