import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '../[processId]/route';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

describe('Status API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock os.tmpdir
    (os.tmpdir as any).mockReturnValue('/mock/tmpdir');
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.readFile to return mock status
    (fs.readFile as any).mockResolvedValue(JSON.stringify({
      step: 'complete',
      progress: 100,
      message: 'Processing complete',
      warnings: [
        {
          type: 'svg-complexity',
          message: 'SVG contains complex elements',
          severity: 'medium'
        }
      ]
    }));
    
    // Mock fs.access to succeed
    (fs.access as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return processing status', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/status/test-process-id');
    
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
    expect(data.status).toBe('complete');
    expect(data.progress).toBe(100);
    expect(data.message).toBe('Processing complete');
    expect(data.warnings).toHaveLength(1);
    expect(data.warnings[0].type).toBe('svg-complexity');
    
    // Check that file was read
    expect(fs.readFile).toHaveBeenCalledWith(expect.stringContaining('test-process-id'));
  });

  it('should handle missing process ID', async () => {
    // Create mock request
    const request = new Request('http://localhost/api/status/');
    
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
    const request = new Request('http://localhost/api/status/non-existent-process');
    
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

  it('should handle invalid status file', async () => {
    // Mock fs.readFile to return invalid JSON
    (fs.readFile as any).mockResolvedValueOnce('invalid-json');
    
    // Create mock request
    const request = new Request('http://localhost/api/status/test-process-id');
    
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
    expect(data.error).toContain('Failed to read status');
  });

  it('should handle file read errors', async () => {
    // Mock fs.readFile to fail
    (fs.readFile as any).mockRejectedValueOnce(new Error('Read error'));
    
    // Create mock request
    const request = new Request('http://localhost/api/status/test-process-id');
    
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
    expect(data.error).toContain('Failed to read status');
  });

  it('should handle incomplete status data', async () => {
    // Mock fs.readFile to return incomplete status
    (fs.readFile as any).mockResolvedValueOnce(JSON.stringify({
      step: 'optimizing'
      // Missing progress and message
    }));
    
    // Create mock request
    const request = new Request('http://localhost/api/status/test-process-id');
    
    // Mock context with params
    const context = {
      params: {
        processId: 'test-process-id'
      }
    };
    
    // Call API endpoint
    const response = await GET(request, context);
    const data = await response.json();
    
    // Check response - should still work with defaults
    expect(response.status).toBe(200);
    expect(data.status).toBe('optimizing');
    expect(data.progress).toBe(0); // Default
    expect(data.message).toBe(''); // Default
    expect(data.warnings).toEqual([]); // Default
  });
});