import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { PackageGeneratorService } from '@/lib/services/package-generator-service';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';
import { FileValidator } from '@/lib/utils/file-validator';
import { FileCleanup } from '@/lib/utils/file-cleanup';
import { createMockFile, createMockFileData, MockFormData, MockResponse } from '@/lib/test-utils/test-setup';
import { ProcessingResult, ProcessingStatus } from '@/types';

// Mock the services and utilities
vi.mock('@/lib/services/file-processing-service');
vi.mock('@/lib/services/package-generator-service');
vi.mock('@/lib/services/preview-generator-service');
vi.mock('@/lib/utils/file-validator');
vi.mock('@/lib/utils/file-cleanup');

// Mock Next.js API handlers
vi.mock('@/app/api/upload/route', async () => {
  const actual = await vi.importActual('@/app/api/upload/route');
  return {
    ...actual,
    // Export the handler for testing
    POST: vi.fn().mockImplementation(actual.POST)
  };
});

vi.mock('@/app/api/status/[processId]/route', async () => {
  const actual = await vi.importActual('@/app/api/status/[processId]/route');
  return {
    ...actual,
    // Export the handler for testing
    GET: vi.fn().mockImplementation(actual.GET)
  };
});

vi.mock('@/app/api/preview/[processId]/route', async () => {
  const actual = await vi.importActual('@/app/api/preview/[processId]/route');
  return {
    ...actual,
    // Export the handler for testing
    GET: vi.fn().mockImplementation(actual.GET)
  };
});

vi.mock('@/app/api/download/[processId]/route', async () => {
  const actual = await vi.importActual('@/app/api/download/[processId]/route');
  return {
    ...actual,
    // Export the handler for testing
    GET: vi.fn().mockImplementation(actual.GET)
  };
});

describe('API Endpoints Tests', () => {
  let mockProcessingResult: ProcessingResult;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock processing result
    mockProcessingResult = {
      originalFile: createMockFileData(),
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
    };
    
    // Mock service methods
    (FileProcessingService.processFile as any).mockResolvedValue(mockProcessingResult);
    (FileValidator.validateFile as any).mockResolvedValue({ valid: true, errors: [], warnings: [] });
    (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValue([
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('gmail-preview')
      }
    ]);
    (PackageGeneratorService.generatePackage as any).mockResolvedValue(Buffer.from('zip-package'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Upload API', () => {
    it('should handle SVG file upload', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Create mock SVG file
      const svgFile = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml',
        content: '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red" /></svg>'
      });
      
      // Create mock form data
      const formData = new FormData();
      formData.append('file', svgFile);
      formData.append('altText', 'Company Logo');
      formData.append('width', '200');
      formData.append('height', '200');
      formData.append('optimizationLevel', 'medium');
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains processId
      expect(responseData.processId).toBeDefined();
      
      // Check that file validation was called
      expect(FileValidator.validateFile).toHaveBeenCalled();
    });

    it('should handle PNG file upload', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Create mock PNG file
      const pngFile = createMockFile({
        name: 'logo.png',
        type: 'image/png',
        content: 'png-data'
      });
      
      // Create mock form data
      const formData = new FormData();
      formData.append('file', pngFile);
      formData.append('altText', 'Company Logo');
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains processId
      expect(responseData.processId).toBeDefined();
    });

    it('should handle JPEG file upload', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Create mock JPEG file
      const jpegFile = createMockFile({
        name: 'logo.jpg',
        type: 'image/jpeg',
        content: 'jpeg-data'
      });
      
      // Create mock form data
      const formData = new FormData();
      formData.append('file', jpegFile);
      formData.append('altText', 'Company Logo');
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains processId
      expect(responseData.processId).toBeDefined();
    });

    it('should reject invalid files', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Mock validation to fail
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: false,
        errors: ['File is too large'],
        warnings: []
      });
      
      // Create mock file
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml'
      });
      
      // Create mock form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is an error
      expect(response.status).toBe(400);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      expect(responseData.validationErrors).toEqual(['File is too large']);
    });

    it('should handle missing file in request', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Create mock form data without file
      const formData = new FormData();
      formData.append('altText', 'Company Logo');
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is an error
      expect(response.status).toBe(400);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      expect(responseData.error).toContain('No file');
    });
  });

  describe('Status API', () => {
    it('should return processing status', async () => {
      // Import the status route handler
      const { GET } = await import('@/app/api/status/[processId]/route');
      
      // Mock processing status
      const mockStatus: ProcessingStatus = {
        step: 'generating-fallbacks',
        progress: 50,
        message: 'Generating fallbacks for email clients'
      };
      
      // Mock global processing status map
      global.processingStatusMap = new Map();
      global.processingStatusMap.set('test-process-id', mockStatus);
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/status/test-process-id'
      };
      const params = { processId: 'test-process-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains status
      expect(responseData).toEqual(mockStatus);
      
      // Clean up
      delete global.processingStatusMap;
    });

    it('should handle unknown process ID', async () => {
      // Import the status route handler
      const { GET } = await import('@/app/api/status/[processId]/route');
      
      // Mock global processing status map
      global.processingStatusMap = new Map();
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/status/unknown-id'
      };
      const params = { processId: 'unknown-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is an error
      expect(response.status).toBe(404);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      
      // Clean up
      delete global.processingStatusMap;
    });
  });

  describe('Preview API', () => {
    it('should return preview data', async () => {
      // Import the preview route handler
      const { GET } = await import('@/app/api/preview/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      global.processingResultsMap.set('test-process-id', mockProcessingResult);
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/preview/test-process-id'
      };
      const params = { processId: 'test-process-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains preview data
      expect(responseData.htmlSnippet).toBeDefined();
      expect(responseData.base64DataUri).toBeDefined();
      expect(responseData.warnings).toBeDefined();
      
      // Clean up
      delete global.processingResultsMap;
    });

    it('should handle unknown process ID', async () => {
      // Import the preview route handler
      const { GET } = await import('@/app/api/preview/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/preview/unknown-id'
      };
      const params = { processId: 'unknown-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is an error
      expect(response.status).toBe(404);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      
      // Clean up
      delete global.processingResultsMap;
    });
  });

  describe('Download API', () => {
    it('should return download package', async () => {
      // Import the download route handler
      const { GET } = await import('@/app/api/download/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      global.processingResultsMap.set('test-process-id', mockProcessingResult);
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/download/test-process-id'
      };
      const params = { processId: 'test-process-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is successful
      expect(response.status).toBe(200);
      
      // Check that response has correct headers
      expect(response.headers.get('Content-Type')).toBe('application/zip');
      expect(response.headers.get('Content-Disposition')).toContain('attachment');
      
      // Clean up
      delete global.processingResultsMap;
    });

    it('should handle unknown process ID', async () => {
      // Import the download route handler
      const { GET } = await import('@/app/api/download/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/download/unknown-id'
      };
      const params = { processId: 'unknown-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is an error
      expect(response.status).toBe(404);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      
      // Clean up
      delete global.processingResultsMap;
    });
  });

  describe('Error Scenarios', () => {
    it('should handle file processing errors', async () => {
      // Import the upload route handler
      const { POST } = await import('@/app/api/upload/route');
      
      // Mock file processing to throw an error
      (FileProcessingService.processFile as any).mockRejectedValueOnce(new Error('Processing failed'));
      
      // Create mock file
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml'
      });
      
      // Create mock form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', 'Company Logo');
      
      // Call the API handler
      const response = await POST({ formData } as any);
      
      // Check that response is an error
      expect(response.status).toBe(500);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      expect(responseData.error).toContain('Processing failed');
    });

    it('should handle preview generation errors', async () => {
      // Import the preview route handler
      const { GET } = await import('@/app/api/preview/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      global.processingResultsMap.set('test-process-id', mockProcessingResult);
      
      // Mock preview generation to throw an error
      (PreviewGeneratorService.generateClientPreviews as any).mockRejectedValueOnce(new Error('Preview generation failed'));
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/preview/test-process-id'
      };
      const params = { processId: 'test-process-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is an error
      expect(response.status).toBe(500);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      
      // Clean up
      delete global.processingResultsMap;
    });

    it('should handle package generation errors', async () => {
      // Import the download route handler
      const { GET } = await import('@/app/api/download/[processId]/route');
      
      // Mock global processing results map
      global.processingResultsMap = new Map();
      global.processingResultsMap.set('test-process-id', mockProcessingResult);
      
      // Mock package generation to throw an error
      (PackageGeneratorService.generatePackage as any).mockRejectedValueOnce(new Error('Package generation failed'));
      
      // Create mock request with params
      const request = {
        url: 'http://localhost:3000/api/download/test-process-id'
      };
      const params = { processId: 'test-process-id' };
      
      // Call the API handler
      const response = await GET(request as any, { params });
      
      // Check that response is an error
      expect(response.status).toBe(500);
      
      // Parse response JSON
      const responseData = await response.json();
      
      // Check that response contains error message
      expect(responseData.error).toBeDefined();
      
      // Clean up
      delete global.processingResultsMap;
    });
  });
});