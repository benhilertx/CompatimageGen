import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../[processId]/route';
import { PackageGeneratorService } from '@/lib/services/package-generator-service';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

vi.mock('@/lib/services/package-generator-service', () => ({
  PackageGeneratorService: {
    generatePackage: vi.fn().mockResolvedValue(Buffer.from('mock-zip-data')),
    generateDefaultInstructions: vi.fn().mockReturnValue('Default instructions')
  }
}));

describe('Download API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock os.tmpdir
    (os.tmpdir as any).mockReturnValue('/mock/tmpdir');
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readFile to return mock data
    (fs.readFile as any).mockImplementation((filePath) => {
      if (filePath.includes('html')) {
        return Promise.resolve('<div>HTML Snippet</div>');
      } else if (filePath.includes('png')) {
        return Promise.resolve(Buffer.from('png-data'));
      } else if (filePath.includes('svg')) {
        return Promise.resolve('<svg>optimized</svg>');
      } else if (filePath.includes('vml')) {
        return Promise.resolve('<!--[if vml]><v:oval></v:oval><![endif]-->');
      } else if (filePath.includes('metadata')) {
        return Promise.resolve(JSON.stringify({
          originalFileSize: 1000,
          optimizedFileSize: 800,
          compressionRatio: 0.8,
          processingTime: 500,
          generatedAt: '2025-07-21T12:00:00Z'
        }));
      } else if (filePath.includes('previews')) {
        return Promise.resolve(JSON.stringify([
          {
            client: 'gmail',
            fallbackUsed: 'png',
            estimatedQuality: 'good',
            previewImage: 'base64-encoded-preview'
          }
        ]));
      }
      return Promise.reject(new Error(`File not found: ${filePath}`));
    });
    
    // Mock fs.access to succeed
    (fs.access as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate and return a ZIP package', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/download/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    
    // Check response
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    
    // Check that files were read
    expect(fs.readFile).toHaveBeenCalledTimes(5); // HTML, PNG, SVG, VML, metadata
    
    // Check that PackageGeneratorService was called
    expect(PackageGeneratorService.generatePackage).toHaveBeenCalledWith(
      expect.objectContaining({
        htmlSnippet: '<div>HTML Snippet</div>',
        pngFile: expect.any(Buffer),
        instructions: expect.any(String),
        previews: expect.any(Array),
        metadata: expect.any(Object)
      })
    );
  });

  it('should handle missing process ID', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/download/');
    
    // Mock context with empty params
    const context = {
      params: {}
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing process ID');
  });

  it('should handle process not found', async () => {
    // Mock fs.access to fail
    (fs.access as any).mockRejectedValueOnce(new Error('File not found'));
    
    // Create mock request
    const request = new Request('http://localhost/api/download/non-existent-process');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'non-existent-process'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(404);
    expect(data.error).toContain('Process not found');
  });

  it('should handle missing result files', async () => {
    // Mock fs.readFile to fail for HTML file
    const originalReadFile = fs.readFile;
    (fs.readFile as any).mockImplementation((filePath) => {
      if (filePath.includes('html')) {
        return Promise.reject(new Error('File not found'));
      }
      return originalReadFile(filePath);
    });
    
    // Create mock request
    const request = new Request('http://localhost/api/download/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to read result files');
  });

  it('should handle package generation errors', async () => {
    // Mock PackageGeneratorService to throw an error
    (PackageGeneratorService.generatePackage as any).mockRejectedValueOnce(new Error('Package generation failed'));
    
    // Create mock request
    const request = new Request('http://localhost/api/download/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to generate package');
  });

  it('should handle missing preview data gracefully', async () => {
    // Mock fs.readFile to fail for previews file
    const originalReadFile = fs.readFile;
    (fs.readFile as any).mockImplementation((filePath) => {
      if (filePath.includes('previews')) {
        return Promise.reject(new Error('File not found'));
      }
      return originalReadFile(filePath);
    });
    
    // Create mock request
    const request = new Request('http://localhost/api/download/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    
    // Check response - should still succeed without previews
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/zip');
    
    // Check that PackageGeneratorService was called with empty previews
    expect(PackageGeneratorService.generatePackage).toHaveBeenCalledWith(
      expect.objectContaining({
        previews: []
      })
    );
  });
});