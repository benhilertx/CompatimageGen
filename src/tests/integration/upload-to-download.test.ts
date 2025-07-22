import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { PackageGeneratorService } from '@/lib/services/package-generator-service';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';
import { createMockFile, createMockFileData } from '@/lib/test-utils/test-setup';
import { FileData, ProcessingOptions, ProcessingResult } from '@/types';

// Mock the services
vi.mock('@/lib/services/file-processing-service');
vi.mock('@/lib/services/package-generator-service');
vi.mock('@/lib/services/preview-generator-service');

describe('Upload to Download Integration Tests', () => {
  let mockFileData: FileData;
  let mockProcessingOptions: ProcessingOptions;
  let mockProcessingResult: ProcessingResult;
  
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
    
    mockProcessingResult = {
      originalFile: mockFileData,
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
    (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValue([
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('gmail-preview')
      },
      {
        client: 'outlook-desktop',
        fallbackUsed: 'vml',
        estimatedQuality: 'excellent',
        previewImage: Buffer.from('outlook-preview')
      }
    ]);
    (PackageGeneratorService.generatePackage as any).mockResolvedValue(Buffer.from('zip-package'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Upload to Download Workflow', () => {
    it('should process a file from upload to download', async () => {
      // Step 1: Process the uploaded file
      const processingResult = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that file processing was called with correct parameters
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, mockProcessingOptions);
      
      // Check that processing result contains expected data
      expect(processingResult).toEqual(mockProcessingResult);
      
      // Step 2: Generate previews
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      // Check that preview generation was called with processing result
      expect(PreviewGeneratorService.generateClientPreviews).toHaveBeenCalledWith(processingResult);
      
      // Check that previews were generated
      expect(previews.length).toBe(2);
      expect(previews[0].client).toBe('gmail');
      expect(previews[1].client).toBe('outlook-desktop');
      
      // Step 3: Generate download package
      const packageData = {
        htmlSnippet: processingResult.htmlSnippet,
        pngFile: processingResult.pngFallback,
        instructions: 'Integration instructions',
        previews,
        metadata: processingResult.metadata
      };
      
      const zipPackage = await PackageGeneratorService.generatePackage(packageData);
      
      // Check that package generation was called with correct data
      expect(PackageGeneratorService.generatePackage).toHaveBeenCalledWith(packageData);
      
      // Check that zip package was generated
      expect(zipPackage).toEqual(Buffer.from('zip-package'));
    });

    it('should handle errors during file processing', async () => {
      // Mock file processing to throw an error
      (FileProcessingService.processFile as any).mockRejectedValueOnce(new Error('Processing failed'));
      
      // Attempt to process the file
      await expect(FileProcessingService.processFile(mockFileData, mockProcessingOptions))
        .rejects.toThrow('Processing failed');
      
      // Check that preview generation and package generation were not called
      expect(PreviewGeneratorService.generateClientPreviews).not.toHaveBeenCalled();
      expect(PackageGeneratorService.generatePackage).not.toHaveBeenCalled();
    });

    it('should handle errors during preview generation', async () => {
      // Mock preview generation to throw an error
      (PreviewGeneratorService.generateClientPreviews as any).mockRejectedValueOnce(new Error('Preview generation failed'));
      
      // Process the file successfully
      const processingResult = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Attempt to generate previews
      await expect(PreviewGeneratorService.generateClientPreviews(processingResult))
        .rejects.toThrow('Preview generation failed');
      
      // Check that package generation was not called
      expect(PackageGeneratorService.generatePackage).not.toHaveBeenCalled();
    });

    it('should handle errors during package generation', async () => {
      // Mock package generation to throw an error
      (PackageGeneratorService.generatePackage as any).mockRejectedValueOnce(new Error('Package generation failed'));
      
      // Process the file and generate previews successfully
      const processingResult = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      // Attempt to generate package
      const packageData = {
        htmlSnippet: processingResult.htmlSnippet,
        pngFile: processingResult.pngFallback,
        instructions: 'Integration instructions',
        previews,
        metadata: processingResult.metadata
      };
      
      await expect(PackageGeneratorService.generatePackage(packageData))
        .rejects.toThrow('Package generation failed');
    });
  });

  describe('Different File Types', () => {
    it('should process PNG files correctly', async () => {
      // Create mock PNG file data
      const pngFileData = createMockFileData({
        buffer: Buffer.from('png-data'),
        originalName: 'logo.png',
        mimeType: 'image/png',
        size: 2000,
        fileType: 'png'
      });
      
      // Mock processing result for PNG
      const pngProcessingResult = {
        ...mockProcessingResult,
        originalFile: pngFileData,
        optimizedSvg: undefined // PNG files don't have SVG content
      };
      
      // Mock file processing for PNG
      (FileProcessingService.processFile as any).mockResolvedValueOnce(pngProcessingResult);
      
      // Process the PNG file
      const processingResult = await FileProcessingService.processFile(pngFileData, mockProcessingOptions);
      
      // Check that file processing was called with PNG file
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(pngFileData, mockProcessingOptions);
      
      // Check that processing result doesn't have SVG content
      expect(processingResult.optimizedSvg).toBeUndefined();
      
      // Generate previews and package as before
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      const packageData = {
        htmlSnippet: processingResult.htmlSnippet,
        pngFile: processingResult.pngFallback,
        instructions: 'Integration instructions',
        previews,
        metadata: processingResult.metadata
      };
      
      const zipPackage = await PackageGeneratorService.generatePackage(packageData);
      
      // Check that package was generated
      expect(zipPackage).toEqual(Buffer.from('zip-package'));
    });

    it('should process JPEG files correctly', async () => {
      // Create mock JPEG file data
      const jpegFileData = createMockFileData({
        buffer: Buffer.from('jpeg-data'),
        originalName: 'logo.jpg',
        mimeType: 'image/jpeg',
        size: 3000,
        fileType: 'jpeg'
      });
      
      // Mock processing result for JPEG
      const jpegProcessingResult = {
        ...mockProcessingResult,
        originalFile: jpegFileData,
        optimizedSvg: undefined // JPEG files don't have SVG content
      };
      
      // Mock file processing for JPEG
      (FileProcessingService.processFile as any).mockResolvedValueOnce(jpegProcessingResult);
      
      // Process the JPEG file
      const processingResult = await FileProcessingService.processFile(jpegFileData, mockProcessingOptions);
      
      // Check that file processing was called with JPEG file
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(jpegFileData, mockProcessingOptions);
      
      // Check that processing result doesn't have SVG content
      expect(processingResult.optimizedSvg).toBeUndefined();
      
      // Generate previews and package as before
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      const packageData = {
        htmlSnippet: processingResult.htmlSnippet,
        pngFile: processingResult.pngFallback,
        instructions: 'Integration instructions',
        previews,
        metadata: processingResult.metadata
      };
      
      const zipPackage = await PackageGeneratorService.generatePackage(packageData);
      
      // Check that package was generated
      expect(zipPackage).toEqual(Buffer.from('zip-package'));
    });
  });

  describe('Processing Options', () => {
    it('should respect different optimization levels', async () => {
      // Create options with different optimization levels
      const lowOptOptions = { ...mockProcessingOptions, optimizationLevel: 'low' as const };
      const highOptOptions = { ...mockProcessingOptions, optimizationLevel: 'high' as const };
      
      // Process with low optimization
      await FileProcessingService.processFile(mockFileData, lowOptOptions);
      
      // Check that file processing was called with low optimization
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, lowOptOptions);
      
      // Process with high optimization
      await FileProcessingService.processFile(mockFileData, highOptOptions);
      
      // Check that file processing was called with high optimization
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, highOptOptions);
    });

    it('should respect custom dimensions', async () => {
      // Create options with custom dimensions
      const customDimensionsOptions = {
        ...mockProcessingOptions,
        dimensions: { width: 400, height: 300 }
      };
      
      // Process with custom dimensions
      await FileProcessingService.processFile(mockFileData, customDimensionsOptions);
      
      // Check that file processing was called with custom dimensions
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, customDimensionsOptions);
    });

    it('should work without generating previews', async () => {
      // Create options without previews
      const noPreviewsOptions = {
        ...mockProcessingOptions,
        generatePreviews: false
      };
      
      // Process without previews
      const processingResult = await FileProcessingService.processFile(mockFileData, noPreviewsOptions);
      
      // Check that file processing was called with no previews option
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, noPreviewsOptions);
      
      // Skip preview generation and go straight to package generation
      const packageData = {
        htmlSnippet: processingResult.htmlSnippet,
        pngFile: processingResult.pngFallback,
        instructions: 'Integration instructions',
        previews: [], // Empty previews
        metadata: processingResult.metadata
      };
      
      const zipPackage = await PackageGeneratorService.generatePackage(packageData);
      
      // Check that package was generated
      expect(zipPackage).toEqual(Buffer.from('zip-package'));
      
      // Check that preview generation was not called
      expect(PreviewGeneratorService.generateClientPreviews).not.toHaveBeenCalled();
    });
  });
});