import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../[processId]/route';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

describe('Preview API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock os.tmpdir
    (os.tmpdir as any).mockReturnValue('/mock/tmpdir');
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readFile to return mock previews
    (fs.readFile as any).mockResolvedValue(JSON.stringify([
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: 'base64-encoded-preview-1'
      },
      {
        client: 'outlook-desktop',
        fallbackUsed: 'vml',
        estimatedQuality: 'excellent',
        previewImage: 'base64-encoded-preview-2'
      }
    ]));
    
    // Mock fs.access to succeed
    (fs.access as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return preview data', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/preview/test-process-id');
    
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
    expect(response.status).toBe(200);
    expect(data.previews).toHaveLength(2);
    expect(data.previews[0].client).toBe('gmail');
    expect(data.previews[0].fallbackUsed).toBe('png');
    expect(data.previews[0].estimatedQuality).toBe('good');
    expect(data.previews[0].previewImage).toBe('base64-encoded-preview-1');
    
    // Check that file was read
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('test-process-id'));
  });

  it('should handle missing process ID', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/preview/');
    
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
    const request = new Request('http://localhost/api/preview/non-existent-process');
    
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

  it('should handle invalid preview file', async () => {
    // Mock fs.readFile to return invalid JSON
    (fs.readFile as any).mockResolvedValueOnce('invalid-json');
    
    // Create mock request
    const request = new Request('http://localhost/api/preview/test-process-id');
    
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
    expect(data.error).toContain('Failed to read preview data');
  });

  it('should handle file read errors', async () => {
    // Mock fs.readFile to fail
    (fs.readFile as any).mockRejectedValueOnce(new Error('Read error'));
    
    // Create mock request
    const request = new Request('http://localhost/api/preview/test-process-id');
    
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
    expect(data.error).toContain('Failed to read preview data');
  });

  it('should handle empty preview data', async () => {
    // Mock fs.readFile to return empty array
    (fs.readFile as any).mockResolvedValueOnce('[]');
    
    // Create mock request
    const request = new Request('http://localhost/api/preview/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response - should still work with empty array
    expect(response.status).toBe(200);
    expect(data.previews).toEqual([]);
  });

  it('should filter out preview images when textOnly parameter is true', async () => {
    // Create mock request with textOnly parameter
    const request = new Request('http://localhost/api/preview/test-process-id?textOnly=true');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response - should not include preview images
    expect(response.status).toBe(200);
    expect(data.previews).toHaveLength(2);
    expect(data.previews[0].previewImage).toBeUndefined();
    expect(data.previews[1].previewImage).toBeUndefined();
  });
});