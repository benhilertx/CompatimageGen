import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileProcessingService } from '../file-processing-service';
import { SVGProcessingService } from '../svg-processing-service';
import { ImageProcessingService } from '../image-processing-service';
import { VMLGeneratorService } from '../vml-generator-service';
import { FileData, ProcessingOptions } from '../../../types';

// Mock dependencies
vi.mock('../svg-processing-service');
vi.mock('../image-processing-service');
vi.mock('../vml-generator-service');

describe('FileProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock SVGProcessingService
    (SVGProcessingService.processSvg as any).mockResolvedValue({
      optimizedSvg: '<svg>optimized</svg>',
      warnings: []
    });
    (SVGProcessingService.canConvertToVml as any).mockReturnValue(true);
    
    // Mock ImageProcessingService
    (ImageProcessingService.generatePngFromSvg as any).mockResolvedValue(Buffer.from('png-data'));
    (ImageProcessingService.convertToBase64DataUri as any).mockReturnValue('data:image/png;base64,cG5nLWRhdGE=');
    (ImageProcessingService.optimizeImage as any).mockResolvedValue({
      buffer: Buffer.from('optimized-image'),
      info: { width: 100, height: 100 },
      warnings: []
    });
    
    // Mock VMLGeneratorService
    (VMLGeneratorService.convertSvgToVml as any).mockResolvedValue({
      vmlCode: '<v:rect>vml-code</v:rect>',
      warnings: []
    });
    (VMLGeneratorService.validateVml as any).mockReturnValue({
      valid: true,
      warnings: []
    });
    (VMLGeneratorService.addOutlookStyling as any).mockReturnValue('<!--[if vml]><v:rect>styled-vml</v:rect><![endif]-->');
  });

  describe('processFile', () => {
    it('should process SVG files correctly', async () => {
      // Arrange
      const fileData: FileData = {
        buffer: Buffer.from('<svg>test</svg>'),
        originalName: 'test.svg',
        mimeType: 'image/svg+xml',
        size: 100,
        fileType: 'svg'
      };
      
      const options: ProcessingOptions = {
        altText: 'Test Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      // Act
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Assert
      expect(result.originalFile).toBe(fileData);
      expect(result.optimizedSvg).toBe('<svg>optimized</svg>');
      expect(result.pngFallback).toEqual(Buffer.from('png-data'));
      expect(result.base64DataUri).toBe('data:image/png;base64,cG5nLWRhdGE=');
      expect(result.vmlCode).toBe('<!--[if vml]><v:rect>styled-vml</v:rect><![endif]-->');
      expect(result.warnings).toEqual([]);
      
      // Verify service calls
      expect(SVGProcessingService.processSvg).toHaveBeenCalledWith('<svg>test</svg>');
      expect(ImageProcessingService.generatePngFromSvg).toHaveBeenCalledWith('<svg>optimized</svg>', 200, 200);
      expect(VMLGeneratorService.convertSvgToVml).toHaveBeenCalledWith('<svg>optimized</svg>', 200, 200);
      expect(VMLGeneratorService.addOutlookStyling).toHaveBeenCalled();
    });

    it('should handle SVG files that cannot be converted to VML', async () => {
      // Arrange
      (SVGProcessingService.canConvertToVml as any).mockReturnValue(false);
      
      const fileData: FileData = {
        buffer: Buffer.from('<svg>complex</svg>'),
        originalName: 'complex.svg',
        mimeType: 'image/svg+xml',
        size: 100,
        fileType: 'svg'
      };
      
      const options: ProcessingOptions = {
        altText: 'Complex Logo',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      // Act
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Assert
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe('vml-conversion');
      expect(result.vmlCode).toContain('<!--[if vml]>');
      expect(result.vmlCode).toContain('fillcolor="#CCCCCC"');
      
      // Verify service calls
      expect(SVGProcessingService.processSvg).toHaveBeenCalledWith('<svg>complex</svg>');
      expect(ImageProcessingService.generatePngFromSvg).toHaveBeenCalledWith('<svg>optimized</svg>', 200, 200);
      expect(VMLGeneratorService.convertSvgToVml).not.toHaveBeenCalled();
    });

    it('should process PNG files correctly', async () => {
      // Arrange
      const fileData: FileData = {
        buffer: Buffer.from('png-data'),
        originalName: 'test.png',
        mimeType: 'image/png',
        size: 100,
        fileType: 'png'
      };
      
      const options: ProcessingOptions = {
        altText: 'Test PNG',
        dimensions: { width: 200, height: 200 },
        generatePreviews: true
      };
      
      // Act
      const result = await FileProcessingService.processFile(fileData, options);
      
      // Assert
      expect(result.originalFile).toBe(fileData);
      expect(result.optimizedSvg).toBeUndefined();
      expect(result.pngFallback).toEqual(Buffer.from('optimized-image'));
      expect(result.base64DataUri).toBe('data:image/png;base64,cG5nLWRhdGE=');
      expect(result.vmlCode).toContain('<!--[if vml]>');
      expect(result.vmlCode).toContain('<v:rect');
      
      // Verify service calls
      expect(ImageProcessingService.optimizeImage).toHaveBeenCalledWith(
        Buffer.from('png-data'),
        'image/png',
        expect.objectContaining({
          width: 200,
          height: 200
        })
      );
    });
  });
});