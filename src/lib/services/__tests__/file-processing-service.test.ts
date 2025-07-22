import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessingService } from '../file-processing-service';
import { SVGProcessingService } from '../svg-processing-service';
import { ImageProcessingService } from '../image-processing-service';
import { VMLGeneratorService } from '../vml-generator-service';
import { FileData, ProcessingOptions } from '@/types';
import { createMockBuffer, createMockFileData } from '@/lib/test-utils/test-setup';

// Mock the dependent services
vi.mock('../svg-processing-service', () => ({
  SVGProcessingService: {
    processSvg: vi.fn().mockResolvedValue({
      optimizedSvg: '<svg>optimized</svg>',
      warnings: []
    }),
    canConvertToVml: vi.fn().mockReturnValue(true)
  }
}));

vi.mock('../image-processing-service', () => ({
  ImageProcessingService: {
    generatePngFromSvg: vi.fn().mockResolvedValue(Buffer.from('png-data')),
    optimizeImage: vi.fn().mockResolvedValue({
      buffer: Buffer.from('optimized-image'),
      info: { width: 100, height: 100 },
      warnings: []
    }),
    convertToBase64DataUri: vi.fn().mockReturnValue('data:image/png;base64,base64-data'),
    compressPng: vi.fn().mockResolvedValue(Buffer.from('compressed-png')),
    compressJpeg: vi.fn().mockResolvedValue(Buffer.from('compressed-jpeg')),
    createFallbackImage: vi.fn().mockResolvedValue(Buffer.from('fallback-image'))
  }
}));

vi.mock('../vml-generator-service', () => ({
  VMLGeneratorService: {
    convertSvgToVml: vi.fn().mockResolvedValue({
      vmlCode: '<!--[if vml]><v:oval></v:oval><![endif]-->',
      warnings: []
    }),
    addOutlookStyling: vi.fn().mockReturnValue('<!--[if vml]><v:oval style="outlook-specific"></v:oval><![endif]-->'),
    validateVml: vi.fn().mockReturnValue({
      valid: true,
      warnings: []
    })
  }
}));

describe('FileProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('processFile', () => {
    it('should process SVG files correctly', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg></svg>'),
        fileType: 'svg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Check that SVG processing was called
      expect(SVGProcessingService.processSvg).toHaveBeenCalledWith(fileData.buffer.toString('utf-8'));
      
      // Check that PNG fallback was generated
      expect(ImageProcessingService.generatePngFromSvg).toHaveBeenCalled();
      
      // Check that VML was generated
      expect(VMLGeneratorService.convertSvgToVml).toHaveBeenCalled();
      
      // Check that result contains expected properties
      expect(result.optimizedSvg).toBeDefined();
      expect(result.pngFallback).toBeDefined();
      expect(result.vmlCode).toBeDefined();
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should process PNG files correctly', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('png-data'),
        fileType: 'png',
        mimeType: 'image/png'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Check that image optimization was called
      expect(ImageProcessingService.optimizeImage).toHaveBeenCalledWith(
        fileData.buffer,
        fileData.mimeType,
        expect.objectContaining({
          width: options.dimensions?.width,
          height: options.dimensions?.height
        })
      );
      
      // Check that result contains expected properties
      expect(result.pngFallback).toBeDefined();
      expect(result.vmlCode).toBeDefined(); // Should have placeholder VML
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      // Should not have SVG content
      expect(result.optimizedSvg).toBeUndefined();
    });

    it('should process JPEG files correctly', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('jpeg-data'),
        fileType: 'jpeg',
        mimeType: 'image/jpeg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Check that image optimization was called
      expect(ImageProcessingService.optimizeImage).toHaveBeenCalledWith(
        fileData.buffer,
        fileData.mimeType,
        expect.anything()
      );
      
      // Check that result contains expected properties
      expect(result.pngFallback).toBeDefined();
      expect(result.vmlCode).toBeDefined(); // Should have placeholder VML
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should process CSS files with placeholder implementation', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('.logo { background: red; }'),
        fileType: 'css',
        mimeType: 'text/css'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Check that fallback image was created
      expect(ImageProcessingService.createFallbackImage).toHaveBeenCalled();
      
      // Check that result contains expected properties
      expect(result.pngFallback).toBeDefined();
      expect(result.vmlCode).toBeDefined(); // Should have placeholder VML
      expect(result.base64DataUri).toBeDefined();
      expect(result.htmlSnippet).toBeDefined();
      expect(result.metadata).toBeDefined();
      
      // Should have warning about CSS processing
      expect(result.warnings.some(w => w.type === 'css-compatibility')).toBe(true);
    });

    it('should handle unsupported file types', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('unknown-data'),
        fileType: 'png', // Intentionally wrong type to test error handling
        mimeType: 'application/octet-stream'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Should throw error for unsupported file type
      await expect(FileProcessingService.processFile(fileData, options)).rejects.toThrow('Unsupported file type');
    });

    it('should handle SVG processing errors', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg>invalid</svg>'),
        fileType: 'svg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Mock SVG processing to fail
      (SVGProcessingService.processSvg as any).mockRejectedValueOnce(new Error('SVG processing failed'));
      
      // Should throw the error
      await expect(FileProcessingService.processFile(fileData, options)).rejects.toThrow('SVG processing failed');
    });

    it('should handle PNG fallback generation errors', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg></svg>'),
        fileType: 'svg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Mock PNG generation to fail
      (ImageProcessingService.generatePngFromSvg as any).mockRejectedValueOnce(new Error('PNG generation failed'));
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Should still complete but with fallback image and warning
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.createFallbackImage).toHaveBeenCalled();
      expect(result.warnings.some(w => w.message.includes('Failed to generate PNG fallback'))).toBe(true);
    });

    it('should handle VML generation errors', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg></svg>'),
        fileType: 'svg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Mock VML generation to fail
      (VMLGeneratorService.convertSvgToVml as any).mockRejectedValueOnce(new Error('VML generation failed'));
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Should still complete but with placeholder VML and warning
      expect(result.vmlCode).toBeDefined();
      expect(result.vmlCode).toContain('<!--[if vml]>');
      expect(result.warnings.some(w => w.message.includes('Failed to generate VML'))).toBe(true);
    });

    it('should handle complex SVGs that cannot be converted to VML', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg>complex</svg>'),
        fileType: 'svg'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Mock canConvertToVml to return false
      (SVGProcessingService.canConvertToVml as any).mockReturnValueOnce(false);
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Should still complete but with warning
      expect(result.warnings.some(w => w.type === 'vml-conversion')).toBe(true);
    });

    it('should handle image optimization errors', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('png-data'),
        fileType: 'png',
        mimeType: 'image/png'
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      // Mock image optimization to fail
      (ImageProcessingService.optimizeImage as any).mockRejectedValueOnce(new Error('Optimization failed'));
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Should still complete with fallback methods
      expect(result.pngFallback).toBeDefined();
      expect(ImageProcessingService.compressPng).toHaveBeenCalled();
      expect(result.warnings.some(w => w.message.includes('Image optimization failed'))).toBe(true);
    });

    it('should include metadata in the result', async () => {
      const fileData = createMockFileData({
        buffer: createMockBuffer('<svg></svg>'),
        fileType: 'svg',
        size: 1000
      });
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        generatePreviews: true
      };
      
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Check metadata properties
      expect(result.metadata).toBeDefined();
      expect(result.metadata.originalFileSize).toBe(fileData.size);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.generatedAt).toBeDefined();
    });
  });
});