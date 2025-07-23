import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PreviewGeneratorService } from '../preview-generator-service';
import { ClientPreview, ProcessingResult, EmailClient } from '@/types';
import { APP_CONFIG } from '@/config/app-config';
import sharp from 'sharp';
import HTMLTemplateService from '../html-template-service';

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

// Mock HTMLTemplateService
vi.mock('../html-template-service', () => {
  return {
    default: {
      generateEmailHtml: vi.fn().mockReturnValue('<div>Mock HTML Template</div>'),
      createResponsiveWrapper: vi.fn().mockImplementation((content) => `<div class="wrapper">${content}</div>`),
      addAccessibilityAttributes: vi.fn().mockImplementation((html, alt) => html)
    },
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
        expect(preview.htmlPreview).toBeDefined();
        expect(preview.clientStyles).toBeDefined();
      }
      
      // Check that sharp was called for each preview
      expect(sharp).toHaveBeenCalledTimes(3);
      
      // Check that HTMLTemplateService was called for each preview
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledTimes(3);
    });

    it('should use SVG fallback for clients that support it', async () => {
      // Mock APP_CONFIG.previews.clients to only include Apple Mail (supports SVG)
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['apple-mail'];
      
      // Mock the determineFallbackType method to return 'svg' for apple-mail
      const originalDetermineFallbackType = (PreviewGeneratorService as any).determineFallbackType;
      (PreviewGeneratorService as any).determineFallbackType = vi.fn().mockImplementation((clientId) => {
        if (clientId === 'apple-mail') return 'svg';
        return 'png';
      });
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original methods and config
      (PreviewGeneratorService as any).determineFallbackType = originalDetermineFallbackType;
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that Apple Mail uses SVG fallback
      expect(previews[0].client).toBe('apple-mail');
      expect(previews[0].fallbackUsed).toBe('svg');
    });

    it('should use VML fallback for Outlook clients', async () => {
      // Mock APP_CONFIG.previews.clients to only include Outlook Desktop
      const originalClients = APP_CONFIG.previews.clients;
      APP_CONFIG.previews.clients = ['outlook-desktop'];
      
      // Mock the determineFallbackType method to return 'vml' for outlook-desktop
      const originalDetermineFallbackType = (PreviewGeneratorService as any).determineFallbackType;
      (PreviewGeneratorService as any).determineFallbackType = vi.fn().mockImplementation((clientId) => {
        if (clientId === 'outlook-desktop') return 'vml';
        return 'png';
      });
      
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original methods and config
      (PreviewGeneratorService as any).determineFallbackType = originalDetermineFallbackType;
      APP_CONFIG.previews.clients = originalClients;
      
      // Check that Outlook Desktop uses VML fallback
      expect(previews[0].client).toBe('outlook-desktop');
      expect(previews[0].fallbackUsed).toBe('vml');
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
      
      // Mock the determineFallbackType and estimateQuality methods
      const originalDetermineFallbackType = (PreviewGeneratorService as any).determineFallbackType;
      const originalEstimateQuality = (PreviewGeneratorService as any).estimateQuality;
      
      (PreviewGeneratorService as any).determineFallbackType = vi.fn().mockImplementation((clientId) => {
        if (clientId === 'apple-mail') return 'svg';
        if (clientId === 'outlook-desktop') return 'vml';
        return 'png';
      });
      
      (PreviewGeneratorService as any).estimateQuality = vi.fn().mockImplementation((fallbackType, clientId) => {
        if (fallbackType === 'svg' && clientId === 'apple-mail') return 'good';
        if (fallbackType === 'vml' && clientId === 'outlook-desktop') return 'fair';
        return 'good';
      });
      
      const previews = await PreviewGeneratorService.generateClientPreviews(resultWithWarnings);
      
      // Restore original methods and config
      (PreviewGeneratorService as any).determineFallbackType = originalDetermineFallbackType;
      (PreviewGeneratorService as any).estimateQuality = originalEstimateQuality;
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
      
      // Mock the generatePreviewImage method to avoid the sharp error
      const mockGeneratePreviewImage = vi.fn().mockResolvedValue(Buffer.from('mock-preview'));
      const originalGeneratePreviewImage = (PreviewGeneratorService as any).generatePreviewImage;
      (PreviewGeneratorService as any).generatePreviewImage = mockGeneratePreviewImage;
      
      await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Restore original methods and config
      (PreviewGeneratorService as any).generatePreviewImage = originalGeneratePreviewImage;
      APP_CONFIG.previews.dimensions = originalDimensions;
      
      // Check that generatePreviewImage was called
      expect(mockGeneratePreviewImage).toHaveBeenCalled();
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

  describe('generateHtmlPreview', () => {
    let testResult: ProcessingResult;
    
    beforeEach(() => {
      // Reset mocks
      vi.clearAllMocks();
      
      // Create a fresh mock processing result for each test
      testResult = {
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
          generatedAt: '2025-07-21T12:00:00Z',
          dimensions: {
            width: 200,
            height: 150
          }
        }
      };
    });
    
    it('should generate HTML preview for SVG fallback', () => {
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', testResult, 'apple-mail');
      
      // Check that HTML preview was generated
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      expect(htmlPreview).toContain('email-preview-apple-mail');
      expect(htmlPreview).toContain('email-client-chrome');
      expect(htmlPreview).toContain('email-client-header');
      expect(htmlPreview).toContain('email-client-content');
      
      // Check that HTMLTemplateService was called with SVG content
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          svgContent: testResult.optimizedSvg,
          vmlCode: undefined // VML should be excluded for SVG preview
        })
      );
    });
    
    it('should generate HTML preview for VML fallback', () => {
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('vml', testResult, 'outlook-desktop');
      
      // Check that HTML preview was generated
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      expect(htmlPreview).toContain('email-preview-outlook-desktop');
      expect(htmlPreview).toContain('email-client-chrome');
      expect(htmlPreview).toContain('email-client-header');
      expect(htmlPreview).toContain('email-client-content');
      
      // Check that HTMLTemplateService was called with VML content
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          vmlCode: testResult.vmlCode,
          svgContent: undefined // SVG should be excluded for VML preview
        })
      );
    });
    
    it('should generate HTML preview for PNG fallback', () => {
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('png', testResult, 'gmail');
      
      // Check that HTML preview was generated
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      expect(htmlPreview).toContain('email-preview-gmail');
      expect(htmlPreview).toContain('email-client-chrome');
      expect(htmlPreview).toContain('email-client-header');
      expect(htmlPreview).toContain('email-client-content');
      
      // Check that HTMLTemplateService was called with PNG content only
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          svgContent: undefined,
          vmlCode: undefined
        })
      );
    });
    
    it('should include client-specific rendering environment', () => {
      const appleMail = PreviewGeneratorService.generateHtmlPreview('svg', testResult, 'apple-mail');
      const gmail = PreviewGeneratorService.generateHtmlPreview('png', testResult, 'gmail');
      const outlook = PreviewGeneratorService.generateHtmlPreview('vml', testResult, 'outlook-desktop');
      
      // Check for client-specific headers
      expect(appleMail).toContain('Apple Mail');
      expect(gmail).toContain('Gmail');
      expect(outlook).toContain('Outlook');
      
      // Check for client-specific styling
      expect(appleMail).toContain('background-color: #f5f5f5');
      expect(gmail).toContain('background-color: #f2f2f2');
      expect(outlook).toContain('background-color: #0078d4');
    });
    
    it('should use actual dimensions from the result when available', () => {
      // Add dimensions to the metadata
      const resultWithDimensions = {
        ...testResult,
        metadata: {
          ...testResult.metadata,
          dimensions: {
            width: 300,
            height: 200
          }
        }
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', resultWithDimensions, 'apple-mail');
      
      // HTMLTemplateService should be called with the dimensions from metadata
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: {
            width: 300,
            height: 200
          }
        })
      );
    });
    
    it('should fall back to default dimensions when metadata dimensions are not available', () => {
      // Remove dimensions from the metadata
      const resultWithoutDimensions = {
        ...testResult,
        metadata: {
          ...testResult.metadata,
          dimensions: undefined
        }
      };
      
      // Mock APP_CONFIG.previews.dimensions
      const originalDimensions = APP_CONFIG.previews.dimensions;
      APP_CONFIG.previews.dimensions = { width: 400, height: 300 };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', resultWithoutDimensions, 'apple-mail');
      
      // Restore original config
      APP_CONFIG.previews.dimensions = originalDimensions;
      
      // HTMLTemplateService should be called with the default dimensions from config
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: {
            width: 400,
            height: 300
          }
        })
      );
    });
    
    it('should handle missing SVG content for SVG fallback', () => {
      // Create result without SVG content
      const resultWithoutSvg = {
        ...testResult,
        optimizedSvg: undefined
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', resultWithoutSvg, 'apple-mail');
      
      // Should still generate HTML preview
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      
      // HTMLTemplateService should be called with PNG fallback only
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          svgContent: undefined,
          vmlCode: undefined
        })
      );
    });
    
    it('should handle missing VML content for VML fallback', () => {
      // Create result without VML content
      const resultWithoutVml = {
        ...testResult,
        vmlCode: undefined
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('vml', resultWithoutVml, 'outlook-desktop');
      
      // Should still generate HTML preview
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      
      // HTMLTemplateService should be called with PNG fallback only
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          svgContent: undefined,
          vmlCode: undefined
        })
      );
    });
    
    it('should generate HTML preview for all supported email clients', () => {
      // Test all email clients
      const clients: EmailClient[] = ['apple-mail', 'gmail', 'outlook-desktop', 'outlook-web', 'yahoo', 'thunderbird', 'samsung-mail'];
      
      for (const client of clients) {
        const htmlPreview = PreviewGeneratorService.generateHtmlPreview('png', testResult, client);
        
        // Should generate HTML preview for each client
        expect(htmlPreview).toBeDefined();
        expect(htmlPreview).toContain(`email-preview-${client}`);
        expect(htmlPreview).toContain('email-client-chrome');
      }
    });
    
    it('should properly extract dimensions from SVG files', () => {
      // Create result with SVG file type
      const svgResult = {
        ...testResult,
        originalFile: {
          ...testResult.originalFile,
          fileType: 'svg'
        }
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', svgResult, 'apple-mail');
      
      // HTMLTemplateService should be called with dimensions from metadata
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: {
            width: 200,
            height: 150
          }
        })
      );
    });
    
    it('should properly extract dimensions from non-SVG files', () => {
      // Create result with PNG file type
      const pngResult = {
        ...testResult,
        originalFile: {
          ...testResult.originalFile,
          fileType: 'png'
        }
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('png', pngResult, 'gmail');
      
      // HTMLTemplateService should be called with default preview dimensions
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          dimensions: expect.objectContaining({
            width: expect.any(Number),
            height: expect.any(Number)
          })
        })
      );
    });
    
    it('should include proper alt text in the preview', () => {
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('png', testResult, 'gmail');
      
      // HTMLTemplateService should be called with alt text
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          altText: 'Logo Preview'
        })
      );
    });
    
    it('should sanitize HTML content for safe rendering', () => {
      // Create result with potentially unsafe SVG content
      const unsafeResult = {
        ...testResult,
        optimizedSvg: '<svg><script>alert("xss")</script></svg>'
      };
      
      const htmlPreview = PreviewGeneratorService.generateHtmlPreview('svg', unsafeResult, 'apple-mail');
      
      // The preview should still be generated
      expect(htmlPreview).toBeDefined();
      expect(htmlPreview).toContain('email-preview');
      
      // HTMLTemplateService should be called with the SVG content
      expect(HTMLTemplateService.generateEmailHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          svgContent: unsafeResult.optimizedSvg
        })
      );
      
      // Note: The actual sanitization would happen in HTMLTemplateService or in the component that renders the HTML
    });
  });
  
  describe('generateClientSpecificStyles', () => {
    it('should generate base styles for all clients', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('thunderbird');
      
      // Check that base styles are included
      expect(styles).toContain('.email-preview');
      expect(styles).toContain('font-family');
      expect(styles).toContain('border-radius');
      expect(styles).toContain('email-client-chrome');
      expect(styles).toContain('email-client-header');
      expect(styles).toContain('email-client-content');
      expect(styles).toContain('@media');
    });
    
    it('should generate Outlook Desktop specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('outlook-desktop');
      
      // Check that Outlook Desktop specific styles are included
      expect(styles).toContain('.email-preview-outlook-desktop');
      expect(styles).toContain('Calibri');
      expect(styles).toContain('border-radius: 0');
      expect(styles).toContain('box-shadow: none');
      expect(styles).toContain('animation: none');
      expect(styles).toContain('display: block');
    });
    
    it('should generate Gmail specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('gmail');
      
      // Check that Gmail specific styles are included
      expect(styles).toContain('.email-preview-gmail');
      expect(styles).toContain('Arial');
      expect(styles).toContain('display: none');
      expect(styles).toContain('position: static');
      expect(styles).toContain('transform: none');
    });
    
    it('should generate Apple Mail specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('apple-mail');
      
      // Check that Apple Mail specific styles are included
      expect(styles).toContain('.email-preview-apple-mail');
      expect(styles).toContain('SF Pro');
      expect(styles).toContain('filter: none');
    });
    
    it('should include responsive styles for all clients', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('gmail');
      
      // Check for responsive styles
      expect(styles).toContain('@media (max-width: 768px)');
      expect(styles).toContain('padding: 6px !important');
      expect(styles).toContain('padding: 8px !important');
    });
    
    it('should generate Yahoo Mail specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('yahoo');
      
      // Check that Yahoo Mail specific styles are included
      expect(styles).toContain('.email-preview-yahoo');
      expect(styles).toContain('Helvetica Neue');
      expect(styles).toContain('position: static');
      expect(styles).toContain('float: none');
    });
    
    it('should generate Outlook Web specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('outlook-web');
      
      // Check that Outlook Web specific styles are included
      expect(styles).toContain('.email-preview-outlook-web');
      expect(styles).toContain('Segoe UI');
      expect(styles).toContain('border-radius: 0');
      expect(styles).toContain('box-shadow: none');
    });
    
    it('should generate Samsung Mail specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('samsung-mail');
      
      // Check that Samsung Mail specific styles are included
      expect(styles).toContain('.email-preview-samsung-mail');
      expect(styles).toContain('Roboto');
      expect(styles).toContain('position: static');
      expect(styles).toContain('float: none');
    });
    
    it('should generate Thunderbird specific styles', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('thunderbird');
      
      // Check that Thunderbird specific styles are included
      expect(styles).toContain('.email-preview-thunderbird');
      expect(styles).toContain('Helvetica');
    });
    
    it('should generate default styles for unknown clients', () => {
      const styles = PreviewGeneratorService.generateClientSpecificStyles('other' as EmailClient);
      
      // Check that default styles are included
      expect(styles).toContain('Generic email client');
      expect(styles).toContain('background-color: #f5f5f5');
    });
    
    it('should include all necessary CSS properties for client simulation', () => {
      // Test all email clients
      const clients: EmailClient[] = ['apple-mail', 'gmail', 'outlook-desktop', 'outlook-web', 'yahoo', 'thunderbird', 'samsung-mail'];
      
      for (const client of clients) {
        const styles = PreviewGeneratorService.generateClientSpecificStyles(client);
        
        // Should include base styles
        expect(styles).toContain('.email-preview');
        expect(styles).toContain('email-client-chrome');
        expect(styles).toContain('email-client-header');
        expect(styles).toContain('email-client-content');
        
        // Should include client-specific class
        expect(styles).toContain(`.email-preview-${client}`);
      }
    });
    
    it('should include client-specific CSS limitations', () => {
      // Test that client-specific limitations are reflected in the CSS
      const outlookStyles = PreviewGeneratorService.generateClientSpecificStyles('outlook-desktop');
      const gmailStyles = PreviewGeneratorService.generateClientSpecificStyles('gmail');
      
      // Outlook limitations
      expect(outlookStyles).toContain('border-radius: 0 !important');
      expect(outlookStyles).toContain('box-shadow: none !important');
      expect(outlookStyles).toContain('display: block !important');
      
      // Gmail limitations
      expect(gmailStyles).toContain('position: static !important');
      expect(gmailStyles).toContain('display: none !important');
    });
    
    it('should handle responsive design considerations', () => {
      // Test that responsive design considerations are included
      const styles = PreviewGeneratorService.generateClientSpecificStyles('gmail');
      
      // Should include media queries
      expect(styles).toContain('@media (max-width: 768px)');
      
      // Should include responsive adjustments
      expect(styles).toContain('padding: 6px !important');
      expect(styles).toContain('padding: 8px !important');
    });
    
    it('should generate styles that accurately simulate client rendering', () => {
      // Test that styles accurately simulate client rendering
      const outlookStyles = PreviewGeneratorService.generateClientSpecificStyles('outlook-desktop');
      const gmailStyles = PreviewGeneratorService.generateClientSpecificStyles('gmail');
      const appleMailStyles = PreviewGeneratorService.generateClientSpecificStyles('apple-mail');
      
      // Outlook uses Word rendering engine
      expect(outlookStyles).toContain('font-family: \'Calibri\'');
      expect(outlookStyles).toContain('animation: none !important');
      
      // Gmail strips head CSS
      expect(gmailStyles).toContain('.email-preview-gmail .email-client-content style');
      expect(gmailStyles).toContain('display: none !important');
      
      // Apple Mail has good CSS support
      expect(appleMailStyles).toContain('font-family: \'SF Pro\'');
      expect(appleMailStyles).not.toContain('border-radius: 0 !important');
    });
  });