import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../route';
import { FileValidator } from '@/lib/utils/file-validator';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('@/lib/utils/file-validator', () => ({
  FileValidator: {
    validateFile: vi.fn(),
    determineFileType: vi.fn()
  }
}));

vi.mock('fs', () => ({
  promises: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn()
  }
}));

vi.mock('uuid', () => ({
  v4: () => 'test-uuid'
}));

// Mock Next.js request/response
const mockFormData = () => {
  const formData = new FormData();
  const file = new File(['test content'], 'test.svg', { type: 'image/svg+xml' });
  formData.append('file', file);
  return formData;
};

const mockRequest = (formData: FormData) => {
  return {
    headers: {
      get: () => 'multipart/form-data; boundary=something'
    },
    formData: async () => formData
  } as unknown as Request;
};

describe('Upload API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful validation by default
    (FileValidator.validateFile as any).mockResolvedValue({
      valid: true,
      errors: [],
      warnings: []
    });
    
    // Mock file type determination
    (FileValidator.determineFileType as any).mockReturnValue('svg');
    
    // Mock file system operations
    (fs.mkdir as any).mockResolvedValue(undefined);
    (fs.writeFile as any).mockResolvedValue(undefined);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return 400 if content-type is not multipart/form-data', async () => {
    const request = {
      headers: {
        get: () => 'application/json'
      }
    } as unknown as Request;
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('Request must be multipart/form-data');
  });
  
  it('should return 400 if no file is provided', async () => {
    const formData = new FormData();
    const request = mockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('No file provided');
  });
  
  it('should return 400 if file validation fails', async () => {
    (FileValidator.validateFile as any).mockResolvedValue({
      valid: false,
      errors: ['File is too large'],
      warnings: []
    });
    
    const formData = mockFormData();
    const request = mockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.error).toBe('File validation failed');
    expect(data.validationResult.errors).toContain('File is too large');
  });
  
  it('should successfully process a valid file upload', async () => {
    const formData = mockFormData();
    const request = mockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.fileId).toBe('test-uuid');
    expect(data.message).toBe('File uploaded successfully');
    expect(fs.mkdir).toHaveBeenCalled();
    expect(fs.writeFile).toHaveBeenCalled();
  });
  
  it('should handle errors during file storage', async () => {
    (fs.writeFile as any).mockRejectedValue(new Error('Storage error'));
    
    const formData = mockFormData();
    const request = mockRequest(formData);
    
    const response = await POST(request);
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to store uploaded file');
    expect(data.details).toBe('Storage error');
  });
});