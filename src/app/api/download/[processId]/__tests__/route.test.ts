import { GET } from '../route';
import { NextRequest } from 'next/server';
import { PackageGeneratorService } from '@/lib/services/package-generator-service';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';
import JSZip from 'jszip';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the services
vi.mock('@/lib/services/package-generator-service', () => ({
  PackageGeneratorService: {
    generatePackage: vi.fn().mockResolvedValue(Buffer.from('mock-zip-data')),
    generateDefaultInstructions: vi.fn().mockReturnValue('Mock instructions')
  }
}));

vi.mock('@/lib/services/preview-generator-service', () => ({
  PreviewGeneratorService: {
    generateClientPreviews: vi.fn().mockResolvedValue([
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('mock-preview-image')
      }
    ])
  }
}));

describe('Download API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should return a ZIP file for a valid process ID', async () => {
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/download/test-process-id');
    
    // Call the API route
    const response = await GET(request, { params: { processId: 'test-process-id' } });
    
    // Check the response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('attachment; filename="email-logo-package.zip"');
    
    // Verify the services were called
    expect(PreviewGeneratorService.generateClientPreviews).toHaveBeenCalled();
    expect(PackageGeneratorService.generatePackage).toHaveBeenCalled();
    expect(PackageGeneratorService.generateDefaultInstructions).toHaveBeenCalled();
  });
  
  it('should return 404 for an invalid process ID', async () => {
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/download/invalid-id');
    
    // Call the API route
    const response = await GET(request, { params: { processId: 'invalid-id' } });
    
    // Check the response
    expect(response.status).toBe(404);
    
    // Parse the JSON response
    const data = await response.json();
    expect(data.error).toBe('Processing result not found');
    
    // Verify the services were not called
    expect(PackageGeneratorService.generatePackage).not.toHaveBeenCalled();
  });
  
  it('should handle errors during package generation', async () => {
    // Mock the package generator to throw an error
    (PackageGeneratorService.generatePackage as any).mockRejectedValueOnce(
      new Error('Package generation failed')
    );
    
    // Create a mock request
    const request = new NextRequest('http://localhost:3000/api/download/test-process-id');
    
    // Call the API route
    const response = await GET(request, { params: { processId: 'test-process-id' } });
    
    // Check the response
    expect(response.status).toBe(500);
    
    // Parse the JSON response
    const data = await response.json();
    expect(data.error).toBe('Failed to generate package');
  });
});