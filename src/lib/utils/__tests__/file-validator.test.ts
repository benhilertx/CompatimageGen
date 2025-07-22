import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileValidator } from '../file-validator';
import { APP_CONFIG } from '@/config/app-config';

// Mock APP_CONFIG
vi.mock('@/config/app-config', () => ({
  APP_CONFIG: {
    upload: {
      maxFileSize: 1024 * 1024, // 1MB
      acceptedFileTypes: {
        svg: ['image/svg+xml'],
        png: ['image/png'],
        jpeg: ['image/jpeg', 'image/jpg'],
        css: ['text/css']
      }
    }
  }
}));

describe('FileValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('validateFile', () => {
    it('should validate a valid SVG file', async () => {
      const file = new File(['<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'], 'test.svg', { type: 'image/svg+xml' });
      
      const result = await FileValidator.validateFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0); // Should have SVG complexity warning
    });
    
    it('should reject files that are too large', async () => {
      // Mock a file larger than the limit
      const mockFile = {
        name: 'large.svg',
        type: 'image/svg+xml',
        size: APP_CONFIG.upload.maxFileSize + 1000,
        text: () => Promise.resolve('<svg></svg>')
      } as unknown as File;
      
      const result = await FileValidator.validateFile(mockFile);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File size exceeds the maximum limit');
    });
    
    it('should reject empty files', async () => {
      const file = new File([''], 'empty.svg', { type: 'image/svg+xml' });
      
      const result = await FileValidator.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File is empty');
    });
    
    it('should reject unsupported file types', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      const result = await FileValidator.validateFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Unsupported file type');
    });
    
    it('should validate SVG structure', async () => {
      const invalidSvg = new File(['<not-svg>Invalid content</not-svg>'], 'invalid.svg', { type: 'image/svg+xml' });
      
      const result = await FileValidator.validateFile(invalidSvg);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid SVG structure');
    });
    
    it('should warn about complex SVG elements', async () => {
      const complexSvg = new File([
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />' +
        '<stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />' +
        '</linearGradient>' +
        '<circle cx="50" cy="50" r="40" fill="url(#grad1)" />' +
        '</svg>'
      ], 'complex.svg', { type: 'image/svg+xml' });
      
      const result = await FileValidator.validateFile(complexSvg);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('complex elements'))).toBe(true);
    });
    
    it('should warn about dangerous SVG elements', async () => {
      const dangerousSvg = new File([
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<script>alert("XSS")</script>' +
        '<circle cx="50" cy="50" r="40" />' +
        '</svg>'
      ], 'dangerous.svg', { type: 'image/svg+xml' });
      
      const result = await FileValidator.validateFile(dangerousSvg);
      
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('dangerous'))).toBe(true);
    });
  });
  
  describe('determineFileType', () => {
    it('should determine file type by MIME type', () => {
      const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const pngFile = new File(['png content'], 'test.png', { type: 'image/png' });
      const jpegFile = new File(['jpeg content'], 'test.jpg', { type: 'image/jpeg' });
      const cssFile = new File(['body { color: red; }'], 'test.css', { type: 'text/css' });
      
      expect(FileValidator.determineFileType(svgFile)).toBe('svg');
      expect(FileValidator.determineFileType(pngFile)).toBe('png');
      expect(FileValidator.determineFileType(jpegFile)).toBe('jpeg');
      expect(FileValidator.determineFileType(cssFile)).toBe('css');
    });
    
    it('should determine file type by extension if MIME type fails', () => {
      const svgFile = new File(['<svg></svg>'], 'test.svg', { type: 'application/octet-stream' });
      const pngFile = new File(['png content'], 'test.png', { type: 'application/octet-stream' });
      const jpegFile = new File(['jpeg content'], 'test.jpg', { type: 'application/octet-stream' });
      const cssFile = new File(['body { color: red; }'], 'test.css', { type: 'application/octet-stream' });
      
      expect(FileValidator.determineFileType(svgFile)).toBe('svg');
      expect(FileValidator.determineFileType(pngFile)).toBe('png');
      expect(FileValidator.determineFileType(jpegFile)).toBe('jpeg');
      expect(FileValidator.determineFileType(cssFile)).toBe('css');
    });
    
    it('should return undefined for unsupported file types', () => {
      const textFile = new File(['text content'], 'test.txt', { type: 'text/plain' });
      
      expect(FileValidator.determineFileType(textFile)).toBeUndefined();
    });
  });
  
  describe('createError', () => {
    it('should create a FileError object', () => {
      const error = FileValidator.createError('file-too-large', 'File is too large', 'Max size is 1MB');
      
      expect(error.code).toBe('file-too-large');
      expect(error.message).toBe('File is too large');
      expect(error.details).toBe('Max size is 1MB');
    });
  });
});