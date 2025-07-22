import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

vi.mock('@/lib/services/file-processing-service', () => ({
  FileProcessingService: {
    processFile: vi.fn().mockResolvedValue({
      originalFile: {
        buffer: Buffer.from('original-file'),
        originalName: 'logo.svg',
        mimeType: 'image/svg+xml',
        size: 1000,
        fileType: 'svg'
      },
      optimizedSvg: '<svg>optimized</svg>',
      pngFallback: Buffer.from('png-fallback'),
      vmlCode: '<!--[if vml]><v:oval></v:oval><![endif]-->',
      base64DataUri: 'data:image/png;base64,base64-data',
      htmlSnippet: '<div>HTML Snippet</div>',
      warnings: [],
      metadata: {
        originalFileSize: 1000,
        optimizedFileSize: 800,
        compressionRatio: 0.8,
        processingTime: 500,
        generatedAt: '2025-07-21T12:00:00Z'
      }
    })
  }
}));

describe('Process API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock os.tmpdir
    (os.tmpdir as any).mockReturnValue('/mock/tmpdir');
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readFile to return mock file
    (fs.readFile as any).mockResolvedValue(Buffer.from('<svg>test</svg>'));
    
    // Mock fs.writeFile to succeed
    (fs.writeFile as any).mockResolvedValue(undefined);
    
    // Mock fs.mkdir to succeed
    (fs.mkdir as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process a file successfully', async () => {
    // Create mock request body
    const requestBody = {
      fileId: 'test-file-id',
      options: {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        optimizationLevel: 'medium',
        generatePreviews: true
      }
    };
    
    // Create mock request
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data.processId).toBeDefined();
    expect(data.status).toBe('complete');
    
    // Check that file was read
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('test-file-id'));
    
    // Check that FileProcessingService was called
    expect(FileProcessingService.processFile).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: expect.any(Buffer),
        fileType: expect.any(String)
      }),
      requestBody.options
    );
    
    // Check that results were saved
    expect(fs.writeFile).toHaveBeenCalledTimes(5); // For each result file
  });

  it('should handle missing fileId', async () => {
    // Create mock request with missing fileId
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: {
          altText: 'Test Logo'
        }
      })
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing fileId');
  });

  it('should handle missing options', async () => {
    // Create mock request with missing options
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: 'test-file-id'
      })
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing options');
  });

  it('should handle file not found', async () => {
    // Mock fs.readFile to fail
    (fs.readFile as any).mockRejectedValueOnce(new Error('File not found'));
    
    // Create mock request
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: 'non-existent-file',
        options: {
          altText: 'Test Logo'
        }
      })
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(404);
    expect(data.error).toContain('File not found');
  });

  it('should handle processing errors', async () => {
    // Mock FileProcessingService to throw an error
    (FileProcessingService.processFile as any).mockRejectedValueOnce(new Error('Processing failed'));
    
    // Create mock request
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileId: 'test-file-id',
        options: {
          altText: 'Test Logo'
        }
      })
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to process file');
    expect(data.status).toBe('error');
  });

  it('should handle invalid JSON in request', async () => {
    // Create mock request with invalid JSON
    const request = new Request('http://localhost/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: 'invalid-json'
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid request');
  });
});