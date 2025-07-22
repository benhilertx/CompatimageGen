import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileValidator } from '../file-validator';
import { APP_CONFIG } from '@/config/app-config';
import { createMockFile } from '@/lib/test-utils/test-setup';

describe('FileValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Store original config values
    const originalMaxFileSize = APP_CONFIG.upload.maxFileSize;
    
    // Set test values
    APP_CONFIG.upload.maxFileSize = 1024 * 1024; // 1MB
    
    return () => {
      // Restore original values
      APP_CONFIG.upload.maxFileSize = originalMaxFileSize;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('validateFile', () => {
    it('should validate valid SVG files', async () => {
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml',
        size: 1000,
        content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>'
      });
      
      const result = await FileValidator.validateFile(file);
      
      // Check that file is valid
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      
      // Should have warning about SVG complexity
      expect(result.warnings.some(w => w.includes('SVG elements'))).toBe(true);
    });

    it('should reject files that exceed size limit', async () => {
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml',
        size: APP_CONFIG.upload.maxFileSize + 1000, // Exceed limit
        content: '<svg></svg>'
      });
      
      const result = await FileValidator.validateFile(file);
      
      // Check that file is invalid due to size
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('File size exceeds'))).toBe(true);
    });

    it('should reject empty files', async () => {
      const file = createMockFile({
        name: 'empty.svg',
        type: 'image/svg+xml',
        size: 0,
        content: ''
      });
      
      const result = await FileValidator.validateFile(file);
      
      // Check that file is invalid due to being empty
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('File is empty'))).toBe(true);
    });

    it('should reject unsupported file types', async () => {
      const file = createMockFile({
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1000,
        content: 'PDF content'
      });
      
      const result = await FileValidator.validateFile(file);
      
      // Check that file is invalid due to unsupported type
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Unsupported file type'))).toBe(true);
    });
  });

  describe('validateSvgStructure', () => {
    it('should validate SVG with valid structure', async () => {
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml',
        content: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>'
      });
      
      const result = { valid: true, errors: [], warnings: [] };
      await FileValidator.validateSvgStructure(file, result);
      
      // Check that validation passed
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect invalid SVG structure', async () => {
      const file = createMockFile({
        name: 'invalid.svg',
        type: 'image/svg+xml',
        content: '<div>Not an SVG</div>'
      });
      
      const result = { valid: true, errors: [], warnings: [] };
      await FileValidator.validateSvgStructure(file, result);
      
      // Check that validation failed
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid SVG structure'))).toBe(true);
    });

    it('should warn about missing xmlns attribute', async () => {
      const file = createMockFile({
        name: 'logo.svg',
        type: 'image/svg+xml',
        content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>'
      });
      
      const result = { valid: true, errors: [], warnings: [] };
      await FileValidator.validateSvgStructure(file, result);
      
      // Check that validation passed but with warning
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('missing xmlns attribute'))).toBe(true);
    });
  });

  describe('isSvgComplex', () => {
    it('should detect animations', () => {
      const svgWithAnimation = '<svg xmlns="http://www.w3.org/2000/svg"><animate attributeName="r" from="0" to="100" dur="1s" /></svg>';
      
      const result = FileValidator.isSvgComplex(svgWithAnimation);
      
      expect(result).toBe(true);
    });

    it('should detect gradients', () => {
      const svgWithGradient = '<svg xmlns="http://www.w3.org/2000/svg"><linearGradient id="grad"></linearGradient></svg>';
      
      const result = FileValidator.isSvgComplex(svgWithGradient);
      
      expect(result).toBe(true);
    });

    it('should not flag simple SVGs as complex', () => {
      const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      
      const result = FileValidator.isSvgComplex(simpleSvg);
      
      expect(result).toBe(false);
    });
  });

  describe('determineFileType', () => {
    it('should determine file type by MIME type', () => {
      const svgFile = createMockFile({ name: 'logo.svg', type: 'image/svg+xml' });
      const pngFile = createMockFile({ name: 'logo.png', type: 'image/png' });
      const jpegFile = createMockFile({ name: 'logo.jpg', type: 'image/jpeg' });
      const cssFile = createMockFile({ name: 'style.css', type: 'text/css' });
      
      expect(FileValidator.determineFileType(svgFile)).toBe('svg');
      expect(FileValidator.determineFileType(pngFile)).toBe('png');
      expect(FileValidator.determineFileType(jpegFile)).toBe('jpeg');
      expect(FileValidator.determineFileType(cssFile)).toBe('css');
    });

    it('should determine file type by extension when MIME type is unknown', () => {
      const svgFile = createMockFile({ name: 'logo.svg', type: 'application/octet-stream' });
      const pngFile = createMockFile({ name: 'logo.png', type: 'application/octet-stream' });
      const jpegFile = createMockFile({ name: 'logo.jpg', type: 'application/octet-stream' });
      const cssFile = createMockFile({ name: 'style.css', type: 'application/octet-stream' });
      
      expect(FileValidator.determineFileType(svgFile)).toBe('svg');
      expect(FileValidator.determineFileType(pngFile)).toBe('png');
      expect(FileValidator.determineFileType(jpegFile)).toBe('jpeg');
      expect(FileValidator.determineFileType(cssFile)).toBe('css');
    });

    it('should return undefined for unsupported file types', () => {
      const pdfFile = createMockFile({ name: 'document.pdf', type: 'application/pdf' });
      const txtFile = createMockFile({ name: 'notes.txt', type: 'text/plain' });
      
      expect(FileValidator.determineFileType(pdfFile)).toBeUndefined();
      expect(FileValidator.determineFileType(txtFile)).toBeUndefined();
    });
  });

  describe('createError', () => {
    it('should create a FileError object with required properties', () => {
      const error = FileValidator.createError('file-too-large', 'File is too large');
      
      expect(error.code).toBe('file-too-large');
      expect(error.message).toBe('File is too large');
      expect(error.details).toBeUndefined();
    });

    it('should include details when provided', () => {
      const error = FileValidator.createError(
        'invalid-file-type',
        'File type not supported',
        'Only SVG, PNG, JPEG, and CSS files are supported'
      );
      
      expect(error.code).toBe('invalid-file-type');
      expect(error.message).toBe('File type not supported');
      expect(error.details).toBe('Only SVG, PNG, JPEG, and CSS files are supported');
    });
  });
});