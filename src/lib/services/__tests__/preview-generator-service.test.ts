import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewGeneratorService } from '../preview-generator-service';
import { ClientPreview, ProcessingResult, EmailClient } from '@/types';
import { APP_CONFIG } from '@/config/app-config';
import sharp from 'sharp';

// Mock sharp
vi.mock('sharp', () => {
  const mockSharpInstance = {
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-preview-image'))
  };
  
  return {
    default: vi.fn().mockImplementation(() => mockSharpInstance),
    __esModule: true
  };
});

describe('PreviewGeneratorService', () => {
  let mockProcessingResult: ProcessingResult;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock processing result for tests
    mockProcessingResult = {
      originalFile: {
        buffer: Buffer.from('original-file'),
        originalName: 'logo.svg',
        mimeType: 'image/svg+xml',
        size: 1000,
        fileType: 'svg'
      },
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateClientPreviews', () => {
    it('should generate previews for configured clients', async () => {
      // Mock APP_CONFIG.previews.clients
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['apple-mail', 'gmail', 'outlook-desktop'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that previews were generated for all configured clients
      expect(previews.length).toBe(3);
      expect(previews.map(p => p.client)).toEqual(['apple-mail', 'gmail', 'outlook-desktop']);
      
      // Check that each preview has the required properties
      for (const preview of previews) {
        expect(preview.fallbackUsed).toBeDefined();
        expect(preview.estimatedQuality).toBeDefined();
        expect(preview.previewImage).toBeDefined();
      }
      
      // Check that sharp was called for each preview
      expect(sharp).toHaveBeenCalledTimes(3);
    });

    it('should use SVG fallback for clients that support it', async () => {
      // Mock APP_CONFIG.previews.clients to only include Apple Mail (supports SVG)
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['apple-mail'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that Apple Mail uses SVG fallback
      expect(previews[0].client).toBe('apple-mail');
      expect(previews[0].fallbackUsed).toBe('svg');
      
      // Check that sharp was called with SVG content
      expect(sharp).toHaveBeenCalledWith(Buffer.from(mockProcessingResult.optimizedSvg as string));
    });

    it('should use VML fallback for Outlook clients', async () => {
      // Mock APP_CONFIG.previews.clients to only include Outlook Desktop
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['outlook-desktop'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that Outlook Desktop uses VML fallback
      expect(previews[0].client).toBe('outlook-desktop');
      expect(previews[0].fallbackUsed).toBe('vml');
      
      // For VML, we use PNG fallback for preview image since we can't render VML directly
      expect(sharp).toHaveBeenCalledWith(mockProcessingResult.pngFallback);
    });

    it('should use PNG fallback for clients that support neither SVG nor VML', async () => {
      // Mock APP_CONFIG.previews.clients to only include Gmail
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['gmail'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that Gmail uses PNG fallback
      expect(previews[0].client).toBe('gmail');
      expect(previews[0].fallbackUsed).toBe('png');
      
      // Check that sharp was called with PNG fallback
      expect(sharp).toHaveBeenCalledWith(mockProcessingResult.pngFallback);
    });

    it('should handle missing SVG content', async () => {
      // Create processing result without SVG content
      const resultWithoutSvg = {
        ...mockProcessingResult,
        optimizedSvg: undefined
      };
      
      // Mock APP_CONFIG.previews.clients to include Apple Mail (normally uses SVG)
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['apple-mail'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(resultWithoutSvg);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Apple Mail should fall back to PNG
      expect(previews[0].client).toBe('apple-mail');
      expect(previews[0].fallbackUsed).toBe('png');
      
      // Check that sharp was called with PNG fallback
      expect(sharp).toHaveBeenCalledWith(resultWithoutSvg.pngFallback);
    });

    it('should handle missing VML content', async () => {
      // Create processing result without VML content
      const resultWithoutVml = {
        ...mockProcessingResult,
        vmlCode: undefined
      };
      
      // Mock APP_CONFIG.previews.clients to include Outlook Desktop (normally uses VML)
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['outlook-desktop'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(resultWithoutVml);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Outlook Desktop should fall back to PNG
      expect(previews[0].client).toBe('outlook-desktop');
      expect(previews[0].fallbackUsed).toBe('png');
      
      // Check that sharp was called with PNG fallback
      expect(sharp).toHaveBeenCalledWith(resultWithoutVml.pngFallback);
    });

    it('should estimate quality based on fallback type and warnings', async () => {
      // Create processing result with warnings
      const resultWithWarnings = {
        ...mockProcessingResult,
        warnings: [
          {
            type: 'svg-complexity',
            message: 'SVG contains complex features',
            severity: 'high'
          },
          {
            type: 'vml-conversion',
            message: 'VML conversion issues',
            severity: 'medium'
          }
        ]
      };
      
      // Mock APP_CONFIG.previews.clients to include all types
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['apple-mail', 'outlook-desktop', 'gmail'];
      
      const previews = await PreviewGeneratorService.generateClientPreviews(resultWithWarnings);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Check quality ratings
      const appleMail = previews.find(p => p.client === 'apple-mail');
      const outlookDesktop = previews.find(p => p.client === 'outlook-desktop');
      const gmail = previews.find(p => p.client === 'gmail');
      
      // Apple Mail uses SVG but has complexity warnings
      expect(appleMail?.estimatedQuality).toBe('good');
      
      // Outlook Desktop uses VML but has conversion warnings
      expect(outlookDesktop?.estimatedQuality).toBe('fair');
      
      // Gmail uses PNG which is generally good
      expect(gmail?.estimatedQuality).toBe('good');
    });

    it('should resize preview images to configured dimensions', async () => {
      // Mock APP_CONFIG.previews
      const originalDimensions = APP_CONFIG.previews.dimensions;
      APP_CONFIG.previews.dimensions = { width: 300, height: 200 };
      APP_CONFIG.previews.clients = ['gmail'];
      
      await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.dimensions = originalDimensions;
      
      // Check that sharp resize was called with configured dimensions
      expect(sharp().resize).toHaveBeenCalledWith(
        300, 
        200, 
        expect.objectContaining({ fit: 'contain' })
      );
    });

    it('should handle errors during preview generation', async () => {
      // Mock sharp to throw an error
      (sharp as any).mockImplementationOnce(() => {
        throw new Error('Preview generation error');
      });
      
      // Mock APP_CONFIG.previews.clients to only include one client
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['gmail'];
      
      // Should not throw but return empty array
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original config
      APP_CONFIG.previews.clients = originalClients;
      
      // Should still have a preview but without an image
      expect(previews.length).toBe(1);
      expect(previews[0].client).toBe('gmail');
      expect(previews[0].previewImage).toBeUndefined();
    });
  });

  describe('generateTextPreviews', () => {
    it('should generate text descriptions for previews', () => {
      const previews: ClientPreview[] = [
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
      
      const textPreviews = PreviewGeneratorService.generateTextPreviews(previews);
      
      // Check that text previews were generated for all previews
      expect(textPreviews.length).toBe(3);
      
      // Check that each text preview contains client name, fallback type, and quality
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

    it('should handle unknown client IDs', () => {
      const previews: ClientPreview[] = [
        {
          client: 'unknown-client' as EmailClient,
          fallbackUsed: 'png',
          estimatedQuality: 'good'
        }
      ];
      
      const textPreviews = PreviewGeneratorService.generateTextPreviews(previews);
      
      // Should use client ID as name
      expect(textPreviews[0]).toContain('unknown-client');
      expect(textPreviews[0]).toContain('PNG raster');
      expect(textPreviews[0]).toContain('good');
    });
  });
});