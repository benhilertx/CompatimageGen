import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PackageGeneratorService } from '../package-generator-service';
import { PackageData, ProcessingMetadata, ClientPreview } from '@/types';
import JSZip from 'jszip';

// Mock JSZip
vi.mock('jszip', () => {
  const mockFolder = {
    file: vi.fn()
  };
  
  const mockZip = {
    file: vi.fn(),
    folder: vi.fn().mockReturnValue(mockFolder),
    generateAsync: vi.fn().mockResolvedValue(Buffer.from('mock-zip-data'))
  };
  
  return {
    default: vi.fn().mockImplementation(() => mockZip),
    __esModule: true
  };
});

describe('PackageGeneratorService', () => {
  let mockPackageData: PackageData;
  let mockMetadata: ProcessingMetadata;
  let mockPreviews: ClientPreview[];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock data for tests
    mockMetadata = {
      originalFileSize: 10000,
      optimizedFileSize: 5000,
      compressionRatio: 0.5,
      processingTime: 1500,
      generatedAt: '2025-07-21T12:00:00Z'
    };
    
    mockPreviews = [
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
      },
      {
        client: 'apple-mail',
        fallbackUsed: 'svg',
        estimatedQuality: 'excellent',
        previewImage: Buffer.from('apple-preview')
      }
    ];
    
    mockPackageData = {
      htmlSnippet: '<div>HTML Snippet</div>',
      pngFile: Buffer.from('png-file-data'),
      instructions: 'Integration instructions',
      previews: mockPreviews,
      metadata: mockMetadata
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePackage', () => {
    it('should create a ZIP file with all package contents', async () => {
      const result = await PackageGeneratorService.generatePackage(mockPackageData);
      
      // Check that JSZip was instantiated
      expect(JSZip).toHaveBeenCalled();
      
      // Check that files were added to the ZIP
      const jsZipInstance = (JSZip as any).mock.results[0].value;
      expect(jsZipInstance.file).toHaveBeenCalledWith('email-logo-snippet.html', mockPackageData.htmlSnippet);
      expect(jsZipInstance.file).toHaveBeenCalledWith('email-logo-fallback.png', mockPackageData.pngFile);
      expect(jsZipInstance.file).toHaveBeenCalledWith('README.md', expect.any(String));
      
      // Check that previews folder was created
      expect(jsZipInstance.folder).toHaveBeenCalledWith('previews');
      
      // Check that preview files were added
      const previewsFolder = jsZipInstance.folder();
      expect(previewsFolder.file).toHaveBeenCalledTimes(mockPreviews.length);
      expect(previewsFolder.file).toHaveBeenCalledWith('gmail-preview.png', mockPreviews[0].previewImage);
      expect(previewsFolder.file).toHaveBeenCalledWith('outlook-desktop-preview.png', mockPreviews[1].previewImage);
      expect(previewsFolder.file).toHaveBeenCalledWith('apple-mail-preview.png', mockPreviews[2].previewImage);
      
      // Check that ZIP was generated
      expect(jsZipInstance.generateAsync).toHaveBeenCalledWith({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: expect.any(Object)
      });
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle missing preview images', async () => {
      // Create package data with some previews missing images
      const packageDataWithMissingPreviews = {
        ...mockPackageData,
        previews: [
          {
            client: 'gmail',
            fallbackUsed: 'png',
            estimatedQuality: 'good',
            previewImage: undefined // Missing preview image
          },
          ...mockPreviews.slice(1)
        ]
      };
      
      const result = await PackageGeneratorService.generatePackage(packageDataWithMissingPreviews);
      
      // Check that JSZip was instantiated
      expect(JSZip).toHaveBeenCalled();
      
      // Check that previews folder was created
      const jsZipInstance = (JSZip as any).mock.results[0].value;
      expect(jsZipInstance.folder).toHaveBeenCalledWith('previews');
      
      // Check that only previews with images were added
      const previewsFolder = jsZipInstance.folder();
      expect(previewsFolder.file).toHaveBeenCalledTimes(2); // Only 2 of 3 previews have images
      expect(previewsFolder.file).not.toHaveBeenCalledWith('gmail-preview.png', undefined);
      
      // Check that ZIP was generated
      expect(jsZipInstance.generateAsync).toHaveBeenCalled();
      
      // Check that result is a buffer
      expect(Buffer.isBuffer(result)).toBe(true);
    });

    it('should handle errors during ZIP generation', async () => {
      // Mock generateAsync to throw an error
      const jsZipInstance = (JSZip as any).mock.results[0].value;
      jsZipInstance.generateAsync.mockRejectedValueOnce(new Error('ZIP generation failed'));
      
      // Should throw the error
      await expect(PackageGeneratorService.generatePackage(mockPackageData)).rejects.toThrow('ZIP generation failed');
    });
  });

  describe('generateInstructions', () => {
    it('should generate markdown instructions with metadata', () => {
      const baseInstructions = 'Base instructions';
      
      const result = (PackageGeneratorService as any).generateInstructions(baseInstructions, mockMetadata);
      
      // Check that result contains base instructions
      expect(result).toContain(baseInstructions);
      
      // Check that result contains metadata
      expect(result).toContain(`Original File Size: ${(mockMetadata.originalFileSize / 1024).toFixed(2)} KB`);
      expect(result).toContain(`Optimized File Size: ${(mockMetadata.optimizedFileSize / 1024).toFixed(2)} KB`);
      expect(result).toContain(`Compression Ratio: ${mockMetadata.compressionRatio.toFixed(2)}x`);
      expect(result).toContain(`Processing Time: ${mockMetadata.processingTime.toFixed(2)}ms`);
      expect(result).toContain(`Generated At: ${mockMetadata.generatedAt}`);
      
      // Check that result contains email client compatibility section
      expect(result).toContain('Email Client Compatibility');
      expect(result).toContain('Modern Clients (Apple Mail, Thunderbird)');
      expect(result).toContain('Web Clients (Gmail, Yahoo)');
      expect(result).toContain('Outlook Desktop');
      
      // Check that result contains integration steps
      expect(result).toContain('Integration Steps');
    });

    it('should format file sizes appropriately', () => {
      // Test with different file sizes
      const smallMetadata = { ...mockMetadata, originalFileSize: 500, optimizedFileSize: 200 };
      const largeMetadata = { ...mockMetadata, originalFileSize: 2 * 1024 * 1024, optimizedFileSize: 1 * 1024 * 1024 };
      
      const smallResult = (PackageGeneratorService as any).generateInstructions('Instructions', smallMetadata);
      const largeResult = (PackageGeneratorService as any).generateInstructions('Instructions', largeMetadata);
      
      // Small sizes should be in KB
      expect(smallResult).toContain('Original File Size: 0.49 KB');
      expect(smallResult).toContain('Optimized File Size: 0.20 KB');
      
      // Large sizes should be in MB
      expect(largeResult).toContain('Original File Size: 2.00 MB');
      expect(largeResult).toContain('Optimized File Size: 1.00 MB');
    });
  });

  describe('generateDefaultInstructions', () => {
    it('should generate default instructions', () => {
      const result = PackageGeneratorService.generateDefaultInstructions();
      
      // Check that result contains expected sections
      expect(result).toContain('How to Use');
      expect(result).toContain('Copy the HTML code');
      expect(result).toContain('Paste it directly into your email template');
      expect(result).toContain('The code includes fallbacks for all major email clients');
      expect(result).toContain('SVG for modern clients');
      expect(result).toContain('PNG for clients that don\'t support SVG');
      expect(result).toContain('VML for Outlook Desktop');
      expect(result).toContain('No external hosting is required');
    });
  });
});