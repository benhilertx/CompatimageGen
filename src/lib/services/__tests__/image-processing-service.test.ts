import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import sharp from 'sharp';
import { ImageProcessingService } from '../image-processing-service';
import { APP_CONFIG } from '../../../config/app-config';

// Mock sharp
vi.mock('sharp', () => {
  const mockSharp = vi.fn();
  mockSharp.mockImplementation(() => ({
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100, format: 'png' })
  }));
  
  // Add the create method to the sharp function
  mockSharp.create = vi.fn().mockReturnValue({
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-fallback-image'))
  });
  
  return { default: mockSharp };
});

describe('ImageProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('compressPng', () => {
    it('should compress PNG images with the correct options', async () => {
      const imageBuffer = Buffer.from('test-png-data');
      
      await ImageProcessingService.compressPng(imageBuffer);
      
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().png).toHaveBeenCalledWith({
        quality: APP_CONFIG.processing.imageOptions.png.quality,
        compressionLevel: APP_CONFIG.processing.imageOptions.png.compressionLevel,
        adaptiveFiltering: APP_CONFIG.processing.imageOptions.png.adaptiveFiltering
      });
      expect(sharp().toBuffer).toHaveBeenCalled();
    });

    it('should use custom quality when provided', async () => {
      const imageBuffer = Buffer.from('test-png-data');
      const customQuality = 75;
      
      await ImageProcessingService.compressPng(imageBuffer, customQuality);
      
      expect(sharp().png).toHaveBeenCalledWith({
        quality: customQuality,
        compressionLevel: APP_CONFIG.processing.imageOptions.png.compressionLevel,
        adaptiveFiltering: APP_CONFIG.processing.imageOptions.png.adaptiveFiltering
      });
    });

    it('should throw an error when compression fails', async () => {
      const imageBuffer = Buffer.from('test-png-data');
      const errorMessage = 'Compression failed';
      
      sharp().toBuffer.mockRejectedValueOnce(new Error(errorMessage));
      
      await expect(ImageProcessingService.compressPng(imageBuffer))
        .rejects.toThrow(`Failed to compress PNG: ${errorMessage}`);
    });
  });

  describe('compressJpeg', () => {
    it('should compress JPEG images with the correct options', async () => {
      const imageBuffer = Buffer.from('test-jpeg-data');
      
      await ImageProcessingService.compressJpeg(imageBuffer);
      
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().jpeg).toHaveBeenCalledWith({
        quality: APP_CONFIG.processing.imageOptions.jpeg.quality,
        progressive: APP_CONFIG.processing.imageOptions.jpeg.progressive
      });
      expect(sharp().toBuffer).toHaveBeenCalled();
    });

    it('should use custom quality when provided', async () => {
      const imageBuffer = Buffer.from('test-jpeg-data');
      const customQuality = 80;
      
      await ImageProcessingService.compressJpeg(imageBuffer, customQuality);
      
      expect(sharp().jpeg).toHaveBeenCalledWith({
        quality: customQuality,
        progressive: APP_CONFIG.processing.imageOptions.jpeg.progressive
      });
    });
  });

  describe('convertToBase64DataUri', () => {
    it('should convert image buffer to base64 data URI', () => {
      const imageBuffer = Buffer.from('test-image-data');
      const mimeType = 'image/png';
      
      const result = ImageProcessingService.convertToBase64DataUri(imageBuffer, mimeType);
      
      const expectedBase64 = imageBuffer.toString('base64');
      expect(result).toBe(`data:${mimeType};base64,${expectedBase64}`);
    });

    it('should handle different MIME types', () => {
      const imageBuffer = Buffer.from('test-image-data');
      const mimeType = 'image/jpeg';
      
      const result = ImageProcessingService.convertToBase64DataUri(imageBuffer, mimeType);
      
      expect(result).toContain(`data:${mimeType};base64,`);
    });
  });

  describe('generatePngFromSvg', () => {
    it('should convert SVG buffer to PNG', async () => {
      const svgBuffer = Buffer.from('<svg></svg>');
      
      await ImageProcessingService.generatePngFromSvg(svgBuffer);
      
      expect(sharp).toHaveBeenCalledWith(svgBuffer);
      expect(sharp().resize).toHaveBeenCalledWith(
        APP_CONFIG.processing.defaultDimensions.width,
        APP_CONFIG.processing.defaultDimensions.height
      );
      expect(sharp().png).toHaveBeenCalledWith(APP_CONFIG.processing.imageOptions.png);
    });

    it('should convert SVG string to PNG', async () => {
      const svgString = '<svg></svg>';
      
      await ImageProcessingService.generatePngFromSvg(svgString);
      
      expect(sharp).toHaveBeenCalledWith(Buffer.from(svgString));
    });

    it('should use custom dimensions when provided', async () => {
      const svgBuffer = Buffer.from('<svg></svg>');
      const width = 300;
      const height = 200;
      
      await ImageProcessingService.generatePngFromSvg(svgBuffer, width, height);
      
      expect(sharp().resize).toHaveBeenCalledWith(width, height);
    });
  });

  describe('resizeImage', () => {
    it('should resize image with default fit option', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const width = 200;
      const height = 150;
      
      await ImageProcessingService.resizeImage(imageBuffer, width, height);
      
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().resize).toHaveBeenCalledWith({
        width,
        height,
        fit: 'contain',
        withoutEnlargement: true
      });
    });

    it('should use custom fit option when provided', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const width = 200;
      const height = 150;
      const fit = 'cover' as keyof sharp.FitEnum;
      
      await ImageProcessingService.resizeImage(imageBuffer, width, height, fit);
      
      expect(sharp().resize).toHaveBeenCalledWith({
        width,
        height,
        fit,
        withoutEnlargement: true
      });
    });
  });

  describe('optimizeImage', () => {
    it('should optimize PNG images', async () => {
      const imageBuffer = Buffer.from('test-png-data');
      const mimeType = 'image/png';
      
      // Mock the toBuffer with resolveWithObject
      sharp().toBuffer.mockImplementationOnce(() => 
        Promise.resolve({ 
          data: Buffer.from('optimized-png-data'), 
          info: { format: 'png', width: 100, height: 100, size: 1000 } 
        })
      );
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().png).toHaveBeenCalled();
      expect(result.buffer).toBeDefined();
      expect(result.info).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    it('should optimize JPEG images', async () => {
      const imageBuffer = Buffer.from('test-jpeg-data');
      const mimeType = 'image/jpeg';
      
      // Mock the toBuffer with resolveWithObject
      sharp().toBuffer.mockImplementationOnce(() => 
        Promise.resolve({ 
          data: Buffer.from('optimized-jpeg-data'), 
          info: { format: 'jpeg', width: 100, height: 100, size: 1000 } 
        })
      );
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().jpeg).toHaveBeenCalled();
      expect(result.buffer).toBeDefined();
      expect(result.info).toBeDefined();
    });

    it('should apply different quality based on optimization level', async () => {
      const imageBuffer = Buffer.from('test-png-data');
      const mimeType = 'image/png';
      
      // Mock the toBuffer with resolveWithObject
      sharp().toBuffer.mockImplementation(() => 
        Promise.resolve({ 
          data: Buffer.from('optimized-data'), 
          info: { format: 'png', width: 100, height: 100, size: 1000 } 
        })
      );
      
      await ImageProcessingService.optimizeImage(imageBuffer, mimeType, { optimizationLevel: 'high' });
      
      expect(sharp().png).toHaveBeenCalledWith(expect.objectContaining({
        quality: 75 // High optimization level should use quality 75
      }));
      
      vi.clearAllMocks();
      
      await ImageProcessingService.optimizeImage(imageBuffer, mimeType, { optimizationLevel: 'low' });
      
      expect(sharp().png).toHaveBeenCalledWith(expect.objectContaining({
        quality: 95 // Low optimization level should use quality 95
      }));
    });

    it('should add warning for large images', async () => {
      const imageBuffer = Buffer.from('test-large-image-data');
      const mimeType = 'image/png';
      
      // Mock metadata to return large dimensions
      sharp().metadata.mockResolvedValueOnce({ width: 3000, height: 3000, format: 'png' });
      
      // Mock the toBuffer with resolveWithObject
      sharp().toBuffer.mockImplementationOnce(() => 
        Promise.resolve({ 
          data: Buffer.from('optimized-data'), 
          info: { format: 'png', width: 3000, height: 3000, size: 5000000 } 
        })
      );
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('file-size');
      expect(result.warnings[0].severity).toBe('medium');
    });
  });

  describe('createFallbackImage', () => {
    it('should create a fallback image with default settings', async () => {
      await ImageProcessingService.createFallbackImage();
      
      expect(sharp.create).toHaveBeenCalledWith({
        create: {
          width: APP_CONFIG.processing.defaultDimensions.width,
          height: APP_CONFIG.processing.defaultDimensions.height,
          channels: 4,
          background: { r: 200, g: 200, b: 200, alpha: 1 }
        }
      });
    });

    it('should use custom dimensions and color when provided', async () => {
      const width = 300;
      const height = 200;
      const color = { r: 100, g: 150, b: 200, alpha: 0.8 };
      
      await ImageProcessingService.createFallbackImage(width, height, color);
      
      expect(sharp.create).toHaveBeenCalledWith({
        create: {
          width,
          height,
          channels: 4,
          background: color
        }
      });
    });
  });
});