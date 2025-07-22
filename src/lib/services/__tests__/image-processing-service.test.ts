import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ImageProcessingService } from '../image-processing-service';
import { APP_CONFIG } from '@/config/app-config';
import { createMockBuffer } from '@/lib/test-utils/test-setup';
import sharp from 'sharp';

// Mock sharp
vi.mock('sharp', () => {
  const mockSharpInstance = {
    png: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockImplementation(options => {
      if (options && options.resolveWithObject) {
        return Promise.resolve({
          data: Buffer.from('mock-image-data'),
          info: { width: 100, height: 100, size: 1000, format: 'png' }
        });
      }
      return Promise.resolve(Buffer.from('mock-image-data'));
    }),
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 })
  };
  
  return {
    default: vi.fn().mockImplementation(() => mockSharpInstance),
    __esModule: true
  };
});

describe('ImageProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('compressPng', () => {
    it('should compress PNG images with default settings', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      
      const result = await ImageProcessingService.compressPng(imageBuffer);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().png).toHaveBeenCalledWith({
        quality: APP_CONFIG.processing.imageOptions.png.quality,
        compressionLevel: APP_CONFIG.processing.imageOptions.png.compressionLevel,
        adaptiveFiltering: APP_CONFIG.processing.imageOptions.png.adaptiveFiltering
      });
      expect(sharp().toBuffer).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should compress PNG images with custom quality', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const customQuality = 75;
      
      const result = await ImageProcessingService.compressPng(imageBuffer, customQuality);
      
      // Check that sharp was called with custom quality
      expect(sharp().png).toHaveBeenCalledWith(expect.objectContaining({
        quality: customQuality
      }));
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors during compression', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('PNG compression error');
      });
      
      await expect(ImageProcessingService.compressPng(imageBuffer)).rejects.toThrow('Failed to compress PNG');
    });
  });

  describe('compressJpeg', () => {
    it('should compress JPEG images with default settings', async () => {
      const imageBuffer = createMockBuffer('mock-jpeg-data');
      
      const result = await ImageProcessingService.compressJpeg(imageBuffer);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().jpeg).toHaveBeenCalledWith({
        quality: APP_CONFIG.processing.imageOptions.jpeg.quality,
        progressive: APP_CONFIG.processing.imageOptions.jpeg.progressive
      });
      expect(sharp().toBuffer).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should compress JPEG images with custom quality', async () => {
      const imageBuffer = createMockBuffer('mock-jpeg-data');
      const customQuality = 65;
      
      const result = await ImageProcessingService.compressJpeg(imageBuffer, customQuality);
      
      // Check that sharp was called with custom quality
      expect(sharp().jpeg).toHaveBeenCalledWith(expect.objectContaining({
        quality: customQuality
      }));
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors during compression', async () => {
      const imageBuffer = createMockBuffer('mock-jpeg-data');
      
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('JPEG compression error');
      });
      
      await expect(ImageProcessingService.compressJpeg(imageBuffer)).rejects.toThrow('Failed to compress JPEG');
    });
  });

  describe('convertToBase64DataUri', () => {
    it('should convert image buffer to base64 data URI', () => {
      const imageBuffer = Buffer.from('mock-image-data');
      const mimeType = 'image/png';
      
      const result = ImageProcessingService.convertToBase64DataUri(imageBuffer, mimeType);
      
      // Check that result is a data URI with correct format
      expect(result).toContain('data:image/png;base64,');
      expect(result).toContain(imageBuffer.toString('base64'));
    });

    it('should handle different MIME types', () => {
      const imageBuffer = Buffer.from('mock-image-data');
      const mimeType = 'image/jpeg';
      
      const result = ImageProcessingService.convertToBase64DataUri(imageBuffer, mimeType);
      
      // Check that result has correct MIME type
      expect(result).toContain('data:image/jpeg;base64,');
    });

    it('should handle errors during conversion', () => {
      // Mock toString to throw an error
      const originalToString = Buffer.prototype.toString;
      Buffer.prototype.toString = function() {
        throw new Error('Base64 conversion error');
      };
      
      const imageBuffer = Buffer.from('mock-image-data');
      
      // Check that error is thrown
      expect(() => ImageProcessingService.convertToBase64DataUri(imageBuffer, 'image/png')).toThrow('Failed to convert image to base64');
      
      // Restore original function
      Buffer.prototype.toString = originalToString;
    });
  });

  describe('generatePngFromSvg', () => {
    it('should convert SVG buffer to PNG', async () => {
      const svgBuffer = createMockBuffer('<svg></svg>');
      
      const result = await ImageProcessingService.generatePngFromSvg(svgBuffer);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(svgBuffer);
      expect(sharp().resize).toHaveBeenCalledWith(
        APP_CONFIG.processing.defaultDimensions.width,
        APP_CONFIG.processing.defaultDimensions.height
      );
      expect(sharp().png).toHaveBeenCalledWith(APP_CONFIG.processing.imageOptions.png);
      expect(sharp().toBuffer).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should convert SVG string to PNG', async () => {
      const svgString = '<svg></svg>';
      
      const result = await ImageProcessingService.generatePngFromSvg(svgString);
      
      // Check that sharp was called with buffer from string
      expect(sharp).toHaveBeenCalledWith(expect.any(Buffer));
      expect(sharp().png).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should use custom dimensions when provided', async () => {
      const svgBuffer = createMockBuffer('<svg></svg>');
      const width = 300;
      const height = 200;
      
      const result = await ImageProcessingService.generatePngFromSvg(svgBuffer, width, height);
      
      // Check that sharp was called with custom dimensions
      expect(sharp().resize).toHaveBeenCalledWith(width, height);
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors during conversion', async () => {
      const svgBuffer = createMockBuffer('<svg></svg>');
      
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('SVG to PNG conversion error');
      });
      
      await expect(ImageProcessingService.generatePngFromSvg(svgBuffer)).rejects.toThrow('Failed to convert SVG to PNG');
    });
  });

  describe('resizeImage', () => {
    it('should resize image with default fit strategy', async () => {
      const imageBuffer = createMockBuffer('mock-image-data');
      const width = 200;
      const height = 150;
      
      const result = await ImageProcessingService.resizeImage(imageBuffer, width, height);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().resize).toHaveBeenCalledWith({
        width,
        height,
        fit: 'contain',
        withoutEnlargement: true
      });
      expect(sharp().toBuffer).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should resize image with custom fit strategy', async () => {
      const imageBuffer = createMockBuffer('mock-image-data');
      const width = 200;
      const height = 150;
      const fit = 'cover';
      
      const result = await ImageProcessingService.resizeImage(imageBuffer, width, height, fit);
      
      // Check that sharp was called with custom fit
      expect(sharp().resize).toHaveBeenCalledWith(expect.objectContaining({
        fit
      }));
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors during resizing', async () => {
      const imageBuffer = createMockBuffer('mock-image-data');
      
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('Image resize error');
      });
      
      await expect(ImageProcessingService.resizeImage(imageBuffer, 200, 150)).rejects.toThrow('Failed to resize image');
    });
  });

  describe('optimizeImage', () => {
    it('should optimize PNG image with default options', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().metadata).toHaveBeenCalled();
      expect(sharp().png).toHaveBeenCalled();
      
      // Check that result contains expected properties
      expect(result.buffer).toBeDefined();
      expect(result.info).toBeDefined();
      expect(result.warnings).toEqual([]);
    });

    it('should optimize JPEG image with default options', async () => {
      const imageBuffer = createMockBuffer('mock-jpeg-data');
      const mimeType = 'image/jpeg';
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(imageBuffer);
      expect(sharp().jpeg).toHaveBeenCalled();
      
      // Check that result contains expected properties
      expect(result.buffer).toBeDefined();
      expect(result.info).toBeDefined();
    });

    it('should use optimization level to determine quality', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      const options = { optimizationLevel: 'high' as const };
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType, options);
      
      // For high optimization, quality should be lower
      expect(sharp().png).toHaveBeenCalledWith(expect.objectContaining({
        quality: 75 // High optimization level quality
      }));
    });

    it('should resize image if dimensions are provided', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      const options = { width: 300, height: 200 };
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType, options);
      
      // Check that resize was called with provided dimensions
      expect(sharp().resize).toHaveBeenCalledWith(expect.objectContaining({
        width: options.width,
        height: options.height
      }));
    });

    it('should warn about large image dimensions', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      
      // Mock metadata to return large dimensions
      (sharp().metadata as any).mockResolvedValueOnce({
        width: 3000,
        height: 3000
      });
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      // Should have warning about large dimensions
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('file-size');
      expect(result.warnings[0].message).toContain('dimensions are very large');
    });

    it('should warn about large output file size', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      
      // Mock toBuffer to return large buffer
      const largeBuffer = Buffer.alloc(APP_CONFIG.upload.maxFileSize / 1.5);
      (sharp().toBuffer as any).mockImplementationOnce(options => {
        if (options && options.resolveWithObject) {
          return Promise.resolve({
            data: largeBuffer,
            info: { size: largeBuffer.length }
          });
        }
        return Promise.resolve(largeBuffer);
      });
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      // Should have warning about large file size
      expect(result.warnings.some(w => w.message.includes('still large'))).toBe(true);
    });

    it('should convert unsupported formats to PNG', async () => {
      const imageBuffer = createMockBuffer('mock-image-data');
      const mimeType = 'image/webp'; // Unsupported format
      
      const result = await ImageProcessingService.optimizeImage(imageBuffer, mimeType);
      
      // Should convert to PNG
      expect(sharp().png).toHaveBeenCalled();
      
      // Should have warning about unsupported format
      expect(result.warnings.some(w => w.message.includes('Unsupported image format'))).toBe(true);
    });

    it('should handle errors during optimization', async () => {
      const imageBuffer = createMockBuffer('mock-png-data');
      const mimeType = 'image/png';
      
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('Image optimization error');
      });
      
      await expect(ImageProcessingService.optimizeImage(imageBuffer, mimeType)).rejects.toThrow('Failed to optimize image');
    });
  });

  describe('createFallbackImage', () => {
    it('should create a fallback image with default settings', async () => {
      const result = await ImageProcessingService.createFallbackImage();
      
      // Check that sharp was called with correct parameters
      expect(sharp).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({
          width: APP_CONFIG.processing.defaultDimensions.width,
          height: APP_CONFIG.processing.defaultDimensions.height,
          channels: 4
        })
      }));
      expect(sharp().png).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should create a fallback image with custom dimensions and color', async () => {
      const width = 300;
      const height = 200;
      const color = { r: 100, g: 150, b: 200, alpha: 0.5 };
      
      const result = await ImageProcessingService.createFallbackImage(width, height, color);
      
      // Check that sharp was called with custom parameters
      expect(sharp).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({
          width,
          height,
          background: color
        })
      }));
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors and create a simpler fallback', async () => {
      // Mock sharp to throw an error on first call but succeed on second
      let callCount = 0;
      (sharp as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Fallback creation error');
        }
        return {
          png: vi.fn().mockReturnThis(),
          toBuffer: vi.fn().mockResolvedValue(Buffer.from('simple-fallback'))
        };
      });
      
      const result = await ImageProcessingService.createFallbackImage();
      
      // Check that sharp was called twice (first fails, second succeeds)
      expect(sharp).toHaveBeenCalledTimes(2);
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });
  });
});