import { PreviewGeneratorService } from '../preview-generator-service';
import { ProcessingResult, ClientPreview } from '@/types';
import sharp from 'sharp';

// Mock sharp
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    resize: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data'))
  }));
});

describe('PreviewGeneratorService', () => {
  // Mock processing result for testing
  const mockResult: ProcessingResult = {
    originalFile: {
      buffer: Buffer.from('test'),
      originalName: 'test.svg',
      mimeType: 'image/svg+xml',
      size: 100,
      fileType: 'svg'
    },
    optimizedSvg: '<svg>test</svg>',
    pngFallback: Buffer.from('png-data'),
    vmlCode: '<v:shape>test</v:shape>',
    base64DataUri: 'data:image/png;base64,cG5nLWRhdGE=',
    htmlSnippet: '<div>test</div>',
    warnings: [],
    metadata: {
      originalFileSize: 100,
      optimizedFileSize: 80,
      compressionRatio: 0.8,
      processingTime: 100,
      generatedAt: '2025-07-21T12:00:00Z'
    }
  };

  describe('generateClientPreviews', () => {
    it('should generate previews for configured clients', async () => {
      const previews = await PreviewGeneratorService.generateClientPreviews(mockResult);
      
      // Check if we have previews for the configured clients
      expect(previews.length).toBeGreaterThan(0);
      
      // Check if each preview has the required properties
      previews.forEach(preview => {
        expect(preview).toHaveProperty('client');
        expect(preview).toHaveProperty('fallbackUsed');
        expect(preview).toHaveProperty('estimatedQuality');
        expect(preview).toHaveProperty('previewImage');
      });
    });

    it('should determine correct fallback types for different clients', async () => {
      const previews = await PreviewGeneratorService.generateClientPreviews(mockResult);
      
      // Apple Mail should use SVG
      const appleMail = previews.find(p => p.client === 'apple-mail');
      expect(appleMail?.fallbackUsed).toBe('svg');
      
      // Gmail should use PNG
      const gmail = previews.find(p => p.client === 'gmail');
      expect(gmail?.fallbackUsed).toBe('png');
      
      // Outlook Desktop should use VML
      const outlookDesktop = previews.find(p => p.client === 'outlook-desktop');
      expect(outlookDesktop?.fallbackUsed).toBe('vml');
    });

    it('should handle warnings and adjust quality ratings', async () => {
      // Create a result with warnings
      const resultWithWarnings: ProcessingResult = {
        ...mockResult,
        warnings: [
          {
            type: 'svg-complexity',
            message: 'SVG contains complex elements',
            severity: 'high'
          },
          {
            type: 'vml-conversion',
            message: 'Some SVG elements could not be converted to VML',
            severity: 'medium'
          }
        ]
      };
      
      const previews = await PreviewGeneratorService.generateClientPreviews(resultWithWarnings);
      
      // Check if quality ratings are adjusted based on warnings
      const appleMail = previews.find(p => p.client === 'apple-mail');
      expect(appleMail?.estimatedQuality).toBe('good'); // Downgraded from excellent due to complexity warning
      
      const outlookDesktop = previews.find(p => p.client === 'outlook-desktop');
      expect(outlookDesktop?.estimatedQuality).toBe('fair'); // Downgraded due to VML conversion warning
    });
  });

  describe('generateTextPreviews', () => {
    it('should generate text descriptions for previews', () => {
      const mockPreviews: ClientPreview[] = [
        {
          client: 'apple-mail',
          fallbackUsed: 'svg',
          estimatedQuality: 'excellent'
        },
        {
          client: 'gmail',
          fallbackUsed: 'png',
          estimatedQuality: 'good'
        },
        {
          client: 'outlook-desktop',
          fallbackUsed: 'vml',
          estimatedQuality: 'fair'
        }
      ];
      
      const textPreviews = PreviewGeneratorService.generateTextPreviews(mockPreviews);
      
      expect(textPreviews).toHaveLength(3);
      expect(textPreviews[0]).toContain('Apple Mail');
      expect(textPreviews[0]).toContain('SVG vector');
      expect(textPreviews[0]).toContain('excellent');
      
      expect(textPreviews[1]).toContain('Gmail');
      expect(textPreviews[1]).toContain('PNG raster');
      expect(textPreviews[1]).toContain('good');
      
      expect(textPreviews[2]).toContain('Outlook Desktop');
      expect(textPreviews[2]).toContain('VML vector');
      expect(textPreviews[2]).toContain('fair');
    });
  });
});