import { PackageGeneratorService } from '../package-generator-service';
import { PackageData, ProcessingMetadata } from '@/types';
import JSZip from 'jszip';
import { describe, it, expect } from 'vitest';

describe('PackageGeneratorService', () => {
  // Mock package data for testing
  const mockMetadata: ProcessingMetadata = {
    originalFileSize: 15000,
    optimizedFileSize: 8000,
    compressionRatio: 1.875,
    processingTime: 350,
    generatedAt: '2025-07-21T12:00:00Z'
  };
  
  const mockPackageData: PackageData = {
    htmlSnippet: '<div>Test HTML</div>',
    pngFile: Buffer.from('test-png-data'),
    instructions: 'Test instructions',
    previews: [
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('test-preview-image')
      }
    ],
    metadata: mockMetadata
  };
  
  describe('generatePackage', () => {
    it('should generate a ZIP file with the correct contents', async () => {
      // Generate the package
      const zipBuffer = await PackageGeneratorService.generatePackage(mockPackageData);
      
      // Verify it's a buffer
      expect(zipBuffer).toBeInstanceOf(Buffer);
      
      // Load the ZIP file to verify contents
      const zip = await JSZip.loadAsync(zipBuffer);
      
      // Check that all expected files exist
      expect(zip.file('email-logo-snippet.html')).toBeTruthy();
      expect(zip.file('email-logo-fallback.png')).toBeTruthy();
      expect(zip.file('README.md')).toBeTruthy();
      expect(zip.folder('previews')).toBeTruthy();
      expect(zip.file('previews/gmail-preview.png')).toBeTruthy();
      
      // Verify file contents
      const htmlContent = await zip.file('email-logo-snippet.html')?.async('string');
      expect(htmlContent).toBe(mockPackageData.htmlSnippet);
      
      const pngContent = await zip.file('email-logo-fallback.png')?.async('nodebuffer');
      expect(pngContent).toEqual(mockPackageData.pngFile);
      
      const readmeContent = await zip.file('README.md')?.async('string');
      expect(readmeContent).toContain('Email Logo Integration Instructions');
      expect(readmeContent).toContain('14.65 KB'); // Original file size
      expect(readmeContent).toContain('7.81 KB'); // Optimized file size
      expect(readmeContent).toContain('1.88x'); // Compression ratio
    });
  });
  
  describe('generateDefaultInstructions', () => {
    it('should generate default instructions with expected content', () => {
      const instructions = PackageGeneratorService.generateDefaultInstructions();
      
      expect(instructions).toContain('How to Use');
      expect(instructions).toContain('SVG for modern clients');
      expect(instructions).toContain('PNG for clients');
      expect(instructions).toContain('VML for Outlook Desktop');
    });
  });
});