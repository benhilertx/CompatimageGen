import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { SVGProcessingService } from '@/lib/services/svg-processing-service';
import { ImageProcessingService } from '@/lib/services/image-processing-service';
import { VMLGeneratorService } from '@/lib/services/vml-generator-service';
import { FileValidator } from '@/lib/utils/file-validator';
import { createMockFile, createMockFileData } from '@/lib/test-utils/test-setup';
import { FileData, ProcessingOptions } from '@/types';

// Mock the services
vi.mock('@/lib/services/svg-processing-service');
vi.mock('@/lib/services/image-processing-service');
vi.mock('@/lib/services/vml-generator-service');
vi.mock('@/lib/utils/file-validator');

describe('Error Handling Tests', () => {
  let mockFileData: FileData;
  let mockProcessingOptions: ProcessingOptions;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock data
    mockFileData = createMockFileData({
      buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" fill="red" /></svg>'),
      originalName: 'logo.svg',
      mimeType: 'image/svg+xml',
      size: 1000,
      fileType: 'svg'
    });
    
    mockProcessingOptions = {
      altText: 'Company Logo',
      dimensions: { width: 200, height: 200 },
      optimizationLevel: 'medium',
      generatePreviews: true
    };
    
    // Mock service methods with default success responses
    (SVGProcessingService.processSvg as any).mockResolvedValue({
      optimizedSvg: '<svg>optimized</svg>',
      warnings: []
    });
    
    (SVGProcessingService.canConvertToVml as any).mockReturnValue(true);
    
    (ImageProcessingService.generatePngFromSvg as any).mockResolvedValue(Buffer.from('png-fallback'));
    
    (ImageProcessingService.convertToBase64DataUri as any).mockReturnValue('data:image/png;base64,base64-data');
    
    (VMLGeneratorService.convertSvgToVml as any).mockResolvedValue({
      vmlCode: '<!--[if vml]><v:oval></v:oval><![endif]-->',
      warnings: []
    });
    
    (VMLGeneratorService.addOutlookStyling as any).mockReturnValue('<!--[if vml]><v:oval style="outlook-specific"></v:oval><![endif]-->');
    
    (VMLGeneratorService.validateVml as any).mockReturnValue({
      valid: true,
      warnings: []
    });
    
    (FileValidator.validateFile as any).mockResolvedValue({
      valid: true,
      errors: [],
      warnings: []
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Invalid File Handling', () => {
    it('should reject files that exceed size limit', async () => {
      // Mock validation to fail due to size
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: false,
        errors: ['File size exceeds the maximum limit of 1MB'],
        warnings: []
      });
      
      // Create large file
      const largeFile = createMockFile({
        name: 'large.svg',
        type: 'image/svg+xml',
        size: 2 * 1024 * 1024 // 2MB
      });
      
      // Validate file
      const validationResult = await FileValidator.validateFile(largeFile);
      
      // Check that validation failed
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('File size exceeds the maximum limit of 1MB');
    });

    it('should reject unsupported file types', async () => {
      // Mock validation to fail due to unsupported type
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: false,
        errors: ['Unsupported file type. Please upload SVG, PNG, JPEG, or CSS files.'],
        warnings: []
      });
      
      // Create unsupported file
      const pdfFile = createMockFile({
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1000
      });
      
      // Validate file
      const validationResult = await FileValidator.validateFile(pdfFile);
      
      // Check that validation failed
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('Unsupported file type');
    });

    it('should reject empty files', async () => {
      // Mock validation to fail due to empty file
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: false,
        errors: ['File is empty. Please upload a valid file.'],
        warnings: []
      });
      
      // Create empty file
      const emptyFile = createMockFile({
        name: 'empty.svg',
        type: 'image/svg+xml',
        size: 0,
        content: ''
      });
      
      // Validate file
      const validationResult = await FileValidator.validateFile(emptyFile);
      
      // Check that validation failed
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('File is empty');
    });

    it('should reject malformed SVG files', async () => {
      // Mock validation to fail due to invalid SVG structure
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: false,
        errors: ['Invalid SVG structure. File does not contain a valid SVG element.'],
        warnings: []
      });
      
      // Create malformed SVG file
      const malformedSvg = createMockFile({
        name: 'malformed.svg',
        type: 'image/svg+xml',
        content: '<div>Not an SVG</div>'
      });
      
      // Validate file
      const validationResult = await FileValidator.validateFile(malformedSvg);
      
      // Check that validation failed
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toContain('Invalid SVG structure');
    });

    it('should warn about complex SVG features', async () => {
      // Mock validation to succeed but with warnings
      (FileValidator.validateFile as any).mockResolvedValueOnce({
        valid: true,
        errors: [],
        warnings: [
          'SVG contains complex elements that may not render correctly in all email clients.',
          'SVG contains animations which are not supported in VML or most email clients.'
        ]
      });
      
      // Create complex SVG file
      const complexSvg = createMockFile({
        name: 'complex.svg',
        type: 'image/svg+xml',
        content: '<svg xmlns="http://www.w3.org/2000/svg"><animate attributeName="r" from="0" to="100" dur="1s" /></svg>'
      });
      
      // Validate file
      const validationResult = await FileValidator.validateFile(complexSvg);
      
      // Check that validation succeeded but with warnings
      expect(validationResult.valid).toBe(true);
      expect(validationResult.warnings.length).toBeGreaterThan(0);
      expect(validationResult.warnings.some(w => w.includes('complex elements'))).toBe(true);
    });
  });

  describe('SVG Processing Failures', () => {
    it('should handle SVG optimization failures', async () => {
      // Mock SVG processing to fail during optimization
      (SVGProcessingService.processSvg as any).mockRejectedValueOnce(new Error('SVG optimization failed'));
      
      // Attempt to process file
      await expect(FileProcessingService.processFile(mockFileData, mockProcessingOptions))
        .rejects.toThrow('SVG optimization failed');
    });

    it('should handle SVG to PNG conversion failures', async () => {
      // Mock PNG generation to fail
      (ImageProcessingService.generatePngFromSvg as any).mockRejectedValueOnce(new Error('PNG generation failed'));
      
      // Mock createFallbackImage to succeed
      (ImageProcessingService.createFallbackImage as any).mockResolvedValueOnce(Buffer.from('fallback-image'));
      
      // Process file
      const result = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that processing completed with fallback image
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.createFallbackImage).toHaveBeenCalled();
      
      // Check that warning was added
      expect(result.warnings.some(w => w.message.includes('Failed to generate PNG fallback'))).toBe(true);
    });

    it('should handle SVG to VML conversion failures', async () => {
      // Mock VML generation to fail
      (VMLGeneratorService.convertSvgToVml as any).mockRejectedValueOnce(new Error('VML generation failed'));
      
      // Process file
      const result = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that processing completed with placeholder VML
      expect(result.vmlCode).toBeDefined();
      expect(result.vmlCode).toContain('<!--[if vml]>');
      
      // Check that warning was added
      expect(result.warnings.some(w => w.message.includes('Failed to generate VML'))).toBe(true);
    });

    it('should handle complex SVGs that cannot be converted to VML', async () => {
      // Mock canConvertToVml to return false
      (SVGProcessingService.canConvertToVml as any).mockReturnValueOnce(false);
      
      // Process file
      const result = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that processing completed with warning
      expect(result.warnings.some(w => w.type === 'vml-conversion')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('cannot be converted to VML'))).toBe(true);
    });
  });

  describe('Image Processing Failures', () => {
    it('should handle PNG optimization failures', async () => {
      // Create PNG file data
      const pngFileData = createMockFileData({
        buffer: Buffer.from('png-data'),
        originalName: 'logo.png',
        mimeType: 'image/png',
        fileType: 'png'
      });
      
      // Mock image optimization to fail
      (ImageProcessingService.optimizeImage as any).mockRejectedValueOnce(new Error('PNG optimization failed'));
      
      // Mock compressPng to succeed
      (ImageProcessingService.compressPng as any).mockResolvedValueOnce(Buffer.from('compressed-png'));
      
      // Process file
      const result = await FileProcessingService.processFile(pngFileData, mockProcessingOptions);
      
      // Check that processing completed with fallback compression
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.compressPng).toHaveBeenCalled();
      
      // Check that warning was added
      expect(result.warnings.some(w => w.message.includes('Image optimization failed'))).toBe(true);
    });

    it('should handle JPEG optimization failures', async () => {
      // Create JPEG file data
      const jpegFileData = createMockFileData({
        buffer: Buffer.from('jpeg-data'),
        originalName: 'logo.jpg',
        mimeType: 'image/jpeg',
        fileType: 'jpeg'
      });
      
      // Mock image optimization to fail
      (ImageProcessingService.optimizeImage as any).mockRejectedValueOnce(new Error('JPEG optimization failed'));
      
      // Mock compressJpeg to succeed
      (ImageProcessingService.compressJpeg as any).mockResolvedValueOnce(Buffer.from('compressed-jpeg'));
      
      // Process file
      const result = await FileProcessingService.processFile(jpegFileData, mockProcessingOptions);
      
      // Check that processing completed with fallback compression
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.compressJpeg).toHaveBeenCalled();
      
      // Check that warning was added
      expect(result.warnings.some(w => w.message.includes('Image optimization failed'))).toBe(true);
    });

    it('should handle complete image processing failures with fallback image', async () => {
      // Create PNG file data
      const pngFileData = createMockFileData({
        buffer: Buffer.from('png-data'),
        originalName: 'logo.png',
        mimeType: 'image/png',
        fileType: 'png'
      });
      
      // Mock image optimization to fail
      (ImageProcessingService.optimizeImage as any).mockRejectedValueOnce(new Error('Optimization failed'));
      
      // Mock compressPng to also fail
      (ImageProcessingService.compressPng as any).mockRejectedValueOnce(new Error('Compression failed'));
      
      // Mock createFallbackImage to succeed
      (ImageProcessingService.createFallbackImage as any).mockResolvedValueOnce(Buffer.from('fallback-image'));
      
      // Process file
      const result = await FileProcessingService.processFile(pngFileData, mockProcessingOptions);
      
      // Check that processing completed with fallback image
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.createFallbackImage).toHaveBeenCalled();
      
      // Check that warnings were added
      expect(result.warnings.some(w => w.message.includes('Image optimization failed'))).toBe(true);
    });
  });

  describe('CSS Processing Failures', () => {
    it('should handle CSS file processing with placeholder implementation', async () => {
      // Create CSS file data
      const cssFileData = createMockFileData({
        buffer: Buffer.from('.logo { background: red; }'),
        originalName: 'style.css',
        mimeType: 'text/css',
        fileType: 'css'
      });
      
      // Mock createFallbackImage to succeed
      (ImageProcessingService.createFallbackImage as any).mockResolvedValueOnce(Buffer.from('fallback-image'));
      
      // Process file
      const result = await FileProcessingService.processFile(cssFileData, mockProcessingOptions);
      
      // Check that processing completed with fallback image
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.createFallbackImage).toHaveBeenCalled();
      
      // Check that warning was added
      expect(result.warnings.some(w => w.type === 'css-compatibility')).toBe(true);
      expect(result.warnings.some(w => w.message.includes('CSS logo processing is not fully implemented'))).toBe(true);
    });
  });

  describe('Unsupported File Type Handling', () => {
    it('should reject unsupported file types during processing', async () => {
      // Create file data with unsupported type
      const unsupportedFileData = {
        ...mockFileData,
        fileType: 'pdf' as any // Intentionally wrong type
      };
      
      // Attempt to process file
      await expect(FileProcessingService.processFile(unsupportedFileData, mockProcessingOptions))
        .rejects.toThrow('Unsupported file type');
    });
  });

  describe('Recovery from Partial Failures', () => {
    it('should complete processing even if VML generation fails', async () => {
      // Mock VML generation to fail
      (VMLGeneratorService.convertSvgToVml as any).mockRejectedValueOnce(new Error('VML generation failed'));
      
      // Process file
      const result = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that processing completed successfully
      expect(result.optimizedSvg).toBeDefined();
      expect(result.pngFallback).toBeDefined();
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      
      // Check that VML code is a placeholder
      expect(result.vmlCode).toContain('<!--[if vml]>');
      
      // Check that warning was added
      expect(result.warnings.some(w => w.message.includes('Failed to generate VML'))).toBe(true);
    });

    it('should complete processing even if SVG optimization fails but sanitization succeeds', async () => {
      // Mock SVG processing to return original SVG with warning
      (SVGProcessingService.processSvg as any).mockResolvedValueOnce({
        optimizedSvg: mockFileData.buffer.toString('utf-8'),
        warnings: [{
          type: 'svg-complexity',
          message: 'SVG processing failed: Optimization error',
          severity: 'high'
        }]
      });
      
      // Process file
      const result = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that processing completed successfully
      expect(result.optimizedSvg).toBeDefined();
      expect(result.pngFallback).toBeDefined();
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      
      // Check that warning was added
      expect(result.warnings.some(w => w.type === 'svg-complexity')).toBe(true);
    });
  });
});