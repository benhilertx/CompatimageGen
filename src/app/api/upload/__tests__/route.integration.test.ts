import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { FileValidator } from '@/lib/utils/file-validator';
import { createMockFile } from '@/lib/test-utils/test-setup';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('mock-uuid')
}));

vi.mock('fs/promises');
vi.mock('path');
vi.mock('os');

vi.mock('@/lib/utils/file-validator', () => ({
  FileValidator: {
    validateFile: vi.fn().mockResolvedValue({
      valid: true,
      errors: [],
      warnings: []
    }),
    determineFileType: vi.fn().mockReturnValue('svg')
  }
}));

describe('Upload API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock os.tmpdir
    (os.tmpdir as any).mockReturnValue('/mock/tmpdir');
    
    // Mock path.join
    (path.join as any).mockImplementation((...args) => args.join('/'));
    
    // Mock fs.mkdir to succeed
    (fs.mkdir as any).mockResolvedValue(undefined);
    
    // Mock fs.writeFile to succeed
    (fs.writeFile as any).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle valid file upload', async () => {
    // Create mock file
    const file = createMockFile({
      name: 'logo.svg',
      type: 'image/svg+xml',
      size: 1000,
      content: '<svg></svg>'
    });
    
    // Create FormData with file
    const formData = new FormData();
    formData.append('file', file);
    
    // Create mock request
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(200);
    expect(data.fileId).toBe('mock-uuid');
    expect(data.validation.valid).toBe(true);
    
    // Check that file was validated
    expect(FileValidator.validateFile).toHaveBeenCalled();
    
    // Check that file was saved
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });

  it('should reject invalid file upload', async () => {
    // Mock FileValidator to return invalid
    (FileValidator.validateFile as any).mockResolvedValueOnce({
      valid: false,
      errors: ['File is too large'],
      warnings: []
    });
    
    // Create mock file
    const file = createMockFile({
      name: 'large.svg',
      type: 'image/svg+xml',
      size: 2000000, // 2MB
      content: '<svg></svg>'
    });
    
    // Create FormData with file
    const formData = new FormData();
    formData.append('file', file);
    
    // Create mock request
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.validation.valid).toBe(false);
    expect(data.validation.errors).toContain('File is too large');
    
    // Check that file was validated
    expect(FileValidator.validateFile).toHaveBeenCalled();
    
    // Check that file was not saved
    expect(fs.writeFile).not.toHaveBeenCalled();
  });

  it('should handle missing file in request', async () => {
    // Create FormData without file
    const formData = new FormData();
    
    // Create mock request
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
    
    // Check that file was not validated
    expect(FileValidator.validateFile).not.toHaveBeenCalled();
  });

  it('should handle file system errors', async () => {
    // Mock fs.writeFile to fail
    (fs.writeFile as any).mockRejectedValueOnce(new Error('Write error'));
    
    // Create mock file
    const file = createMockFile({
      name: 'logo.svg',
      type: 'image/svg+xml',
      size: 1000,
      content: '<svg></svg>'
    });
    
    // Create FormData with file
    const formData = new FormData();
    formData.append('file', file);
    
    // Create mock request
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Call API endpoint
    const response = await POST(request);
    const data = await response.json();
    
    // Check response
    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to save uploaded file');
  });

  it('should create temp directory if it does not exist', async () => {
    // Mock fs.mkdir to fail first time (directory does not exist)
    (fs.mkdir as any)
      .mockRejectedValueOnce(new Error('Directory does not exist'))
      .mockResolvedValueOnce(undefined);
    
    // Create mock file
    const file = createMockFile({
      name: 'logo.svg',
      type: 'image/svg+xml',
      size: 1000,
      content: '<svg></svg>'
    });
    
    // Create FormData with file
    const formData = new FormData();
    formData.append('file', file);
    
    // Create mock request
    const request = new Request('http://localhost/api/upload', {
      method: 'POST',
      body: formData
    });
    
    // Call API endpoint
    const response = await POST(request);
    
    // Check that mkdir was called twice (first fails, second succeeds)
    expect(fs.mkdir).toHaveBeenCalledTimes(2);
    
    // Check that file was saved
    expect(fs.writeFile).toHaveBeenCalled();
    
    // Check response
    expect(response.status).toBe(200);
  });
});