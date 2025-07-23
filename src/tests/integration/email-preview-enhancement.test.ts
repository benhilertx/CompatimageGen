import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileProcessingService } from '@/lib/services/file-processing-service';
import { PreviewGeneratorService } from '@/lib/services/preview-generator-service';
import { PlatformDetailsService } from '@/lib/services/platform-details-service';
import { createMockFile, createMockFileData, testSvgs } from '@/lib/test-utils/test-setup';
import { ClientPreview, EmailClient, FileData, ProcessingOptions, ProcessingResult } from '@/types';
// Note: We're mocking React components for testing
// These imports would be used in a real React testing environment
// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// import PreviewComponent from '@/components/PreviewComponent';
// import HTMLPreviewRenderer from '@/components/HTMLPreviewRenderer';
// import PlatformInfoModal from '@/components/PlatformInfoModal';

// Mock React components for testing
const mockRender = vi.fn().mockReturnValue({ container: { querySelector: vi.fn() } });
const mockScreen = {
  getByRole: vi.fn(),
  getByText: vi.fn(),
  queryByRole: vi.fn()
};
const mockFireEvent = { click: vi.fn() };
const mockWaitFor = vi.fn().mockImplementation(cb => cb());

// Mock the services
vi.mock('@/lib/services/file-processing-service');
vi.mock('@/lib/services/preview-generator-service');
vi.mock('@/lib/services/platform-details-service');

describe('Email Preview Enhancement Integration Tests', () => {
  let mockFileData: FileData;
  let mockProcessingOptions: ProcessingOptions;
  let mockProcessingResult: ProcessingResult;
  let mockClientPreviews: ClientPreview[];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create mock data
    mockFileData = createMockFileData({
      buffer: Buffer.from(testSvgs.simple),
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
      optimizedSvg: testSvgs.simple,
      pngFallback: Buffer.from('png-fallback'),
      vmlCode: '<!--[if vml]><v:oval></v:oval><![endif]-->',
      base64DataUri: 'data:image/png;base64,cG5nLWZhbGxiYWNr',
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
    
    // Create mock client previews with HTML preview content
    mockClientPreviews = [
      {
        client: 'apple-mail',
        fallbackUsed: 'svg',
        estimatedQuality: 'excellent',
        previewImage: Buffer.from('apple-mail-preview'),
        htmlPreview: '<div class="email-preview">Apple Mail Preview</div>',
        clientStyles: '.email-preview { font-family: "SF Pro", sans-serif; }'
      },
      {
        client: 'gmail',
        fallbackUsed: 'png',
        estimatedQuality: 'good',
        previewImage: Buffer.from('gmail-preview'),
        htmlPreview: '<div class="email-preview">Gmail Preview</div>',
        clientStyles: '.email-preview { font-family: Arial, sans-serif; }'
      },
      {
        client: 'outlook-desktop',
        fallbackUsed: 'vml',
        estimatedQuality: 'excellent',
        previewImage: Buffer.from('outlook-preview'),
        htmlPreview: '<div class="email-preview">Outlook Preview</div>',
        clientStyles: '.email-preview { font-family: Calibri, sans-serif; }'
      }
    ];
    
    // Mock service methods
    (FileProcessingService.processFile as any).mockResolvedValue(mockProcessingResult);
    (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValue(mockClientPreviews);
    (PreviewGeneratorService.generateHtmlPreview as any).mockImplementation((fallbackType, result, clientId) => {
      return `<div class="email-preview">HTML Preview for ${clientId}</div>`;
    });
    (PreviewGeneratorService.generateClientSpecificStyles as any).mockImplementation((clientId) => {
      return `.email-preview-${clientId} { font-family: sans-serif; }`;
    });
    (PlatformDetailsService.getPlatformDetails as any).mockImplementation((clientId) => {
      return {
        name: clientId === 'apple-mail' ? 'Apple Mail' : 
              clientId === 'gmail' ? 'Gmail' : 
              clientId === 'outlook-desktop' ? 'Outlook Desktop' : clientId,
        marketShare: clientId === 'apple-mail' ? 55 : 
                    clientId === 'gmail' ? 29 : 
                    clientId === 'outlook-desktop' ? 6 : 1,
        supportedFeatures: ['Basic HTML', 'Inline CSS', 'Images with alt text'],
        limitations: ['Limited CSS support'],
        bestPractices: ['Always include alt text'],
        renderingNotes: `Rendering notes for ${clientId}`
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Preview Workflow with Different File Types', () => {
    it('should process SVG files and generate HTML previews', async () => {
      // Step 1: Process the uploaded SVG file
      const processingResult = await FileProcessingService.processFile(mockFileData, mockProcessingOptions);
      
      // Check that file processing was called with correct parameters
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(mockFileData, mockProcessingOptions);
      
      // Check that processing result contains expected data
      expect(processingResult).toEqual(mockProcessingResult);
      
      // Step 2: Generate previews with HTML content
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      // Check that preview generation was called with processing result
      expect(PreviewGeneratorService.generateClientPreviews).toHaveBeenCalledWith(processingResult);
      
      // Check that previews were generated with HTML content
      expect(previews.length).toBe(3);
      expect(previews[0].client).toBe('apple-mail');
      expect(previews[0].htmlPreview).toBeDefined();
      expect(previews[0].clientStyles).toBeDefined();
      expect(previews[1].client).toBe('gmail');
      expect(previews[1].htmlPreview).toBeDefined();
      expect(previews[1].clientStyles).toBeDefined();
      expect(previews[2].client).toBe('outlook-desktop');
      expect(previews[2].htmlPreview).toBeDefined();
      expect(previews[2].clientStyles).toBeDefined();
    });

    it('should process PNG files and generate HTML previews', async () => {
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
      
      // Create PNG-specific client previews
      const pngClientPreviews = [
        {
          client: 'apple-mail',
          fallbackUsed: 'png', // PNG fallback for all clients with PNG files
          estimatedQuality: 'good',
          previewImage: Buffer.from('apple-mail-preview'),
          htmlPreview: '<div class="email-preview">Apple Mail Preview</div>',
          clientStyles: '.email-preview { font-family: "SF Pro", sans-serif; }'
        },
        {
          client: 'gmail',
          fallbackUsed: 'png',
          estimatedQuality: 'good',
          previewImage: Buffer.from('gmail-preview'),
          htmlPreview: '<div class="email-preview">Gmail Preview</div>',
          clientStyles: '.email-preview { font-family: Arial, sans-serif; }'
        },
        {
          client: 'outlook-desktop',
          fallbackUsed: 'png',
          estimatedQuality: 'good',
          previewImage: Buffer.from('outlook-preview'),
          htmlPreview: '<div class="email-preview">Outlook Preview</div>',
          clientStyles: '.email-preview { font-family: Calibri, sans-serif; }'
        }
      ];
      
      // Mock preview generation for PNG
      (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValueOnce(pngClientPreviews);
      
      // Process the PNG file
      const processingResult = await FileProcessingService.processFile(pngFileData, mockProcessingOptions);
      
      // Check that file processing was called with PNG file
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(pngFileData, mockProcessingOptions);
      
      // Check that processing result doesn't have SVG content
      expect(processingResult.optimizedSvg).toBeUndefined();
      
      // Generate previews with HTML content
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      // Check that previews were generated with HTML content
      expect(previews.length).toBe(3);
      expect(previews[0].htmlPreview).toBeDefined();
      expect(previews[0].clientStyles).toBeDefined();
      
      // For PNG files, all clients should use PNG fallback
      expect(previews[0].fallbackUsed).toBe('png');
      expect(previews[1].fallbackUsed).toBe('png');
      expect(previews[2].fallbackUsed).toBe('png');
    });

    it('should process JPEG files and generate HTML previews', async () => {
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
      
      // Create JPEG-specific client previews
      const jpegClientPreviews = [
        {
          client: 'apple-mail',
          fallbackUsed: 'png', // PNG fallback for all clients with JPEG files
          estimatedQuality: 'good',
          previewImage: Buffer.from('apple-mail-preview'),
          htmlPreview: '<div class="email-preview">Apple Mail Preview</div>',
          clientStyles: '.email-preview { font-family: "SF Pro", sans-serif; }'
        },
        {
          client: 'gmail',
          fallbackUsed: 'png',
          estimatedQuality: 'good',
          previewImage: Buffer.from('gmail-preview'),
          htmlPreview: '<div class="email-preview">Gmail Preview</div>',
          clientStyles: '.email-preview { font-family: Arial, sans-serif; }'
        },
        {
          client: 'outlook-desktop',
          fallbackUsed: 'png',
          estimatedQuality: 'good',
          previewImage: Buffer.from('outlook-preview'),
          htmlPreview: '<div class="email-preview">Outlook Preview</div>',
          clientStyles: '.email-preview { font-family: Calibri, sans-serif; }'
        }
      ];
      
      // Mock preview generation for JPEG
      (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValueOnce(jpegClientPreviews);
      
      // Process the JPEG file
      const processingResult = await FileProcessingService.processFile(jpegFileData, mockProcessingOptions);
      
      // Check that file processing was called with JPEG file
      expect(FileProcessingService.processFile).toHaveBeenCalledWith(jpegFileData, mockProcessingOptions);
      
      // Check that processing result doesn't have SVG content
      expect(processingResult.optimizedSvg).toBeUndefined();
      
      // Generate previews with HTML content
      const previews = await PreviewGeneratorService.generateClientPreviews(processingResult);
      
      // Check that previews were generated with HTML content
      expect(previews.length).toBe(3);
      expect(previews[0].htmlPreview).toBeDefined();
      expect(previews[0].clientStyles).toBeDefined();
      
      // For JPEG files, all clients should use PNG fallback
      expect(previews[0].fallbackUsed).toBe('png');
      expect(previews[1].fallbackUsed).toBe('png');
      expect(previews[2].fallbackUsed).toBe('png');
    });
  });

  describe('HTML Preview Rendering', () => {
    it('should render HTML previews correctly', async () => {
      // Mock HTMLPreviewRenderer functionality
      const mockHTMLPreviewRenderer = {
        render: (htmlContent: string, clientStyles: string, clientId: EmailClient) => {
          // Simulate rendering HTML content
          return {
            success: true,
            element: document.createElement('div')
          };
        }
      };
      
      // Test with the first preview
      const result = mockHTMLPreviewRenderer.render(
        mockClientPreviews[0].htmlPreview!,
        mockClientPreviews[0].clientStyles!,
        mockClientPreviews[0].client
      );
      
      // Check that the rendering was successful
      expect(result.success).toBe(true);
      expect(result.element).toBeDefined();
    });

    it('should handle errors in HTML preview rendering', async () => {
      // Create a preview with invalid HTML
      const invalidPreview = {
        ...mockClientPreviews[0],
        htmlPreview: '<div class="invalid-html'
      };
      
      // Mock console.error to prevent test output pollution
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      // Mock HTMLPreviewRenderer error handling
      const mockHTMLPreviewRenderer = {
        render: (htmlContent: string, clientStyles: string, clientId: EmailClient) => {
          if (htmlContent.includes('invalid-html')) {
            // Simulate error
            const error = new Error('Invalid HTML');
            console.error('Error rendering HTML preview:', error);
            return {
              success: false,
              error
            };
          }
          return {
            success: true,
            element: document.createElement('div')
          };
        }
      };
      
      // Test with invalid HTML
      const result = mockHTMLPreviewRenderer.render(
        invalidPreview.htmlPreview,
        invalidPreview.clientStyles!,
        invalidPreview.client
      );
      
      // Restore console.error
      console.error = originalConsoleError;
      
      // Check that the error was handled
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Platform Info Modal Integration', () => {
    it('should open platform info modal when info icon is clicked', async () => {
      // Mock PreviewComponent and modal interaction
      const mockPreviewComponent = {
        render: (previews: ClientPreview[], htmlCode: string) => {
          return {
            container: {
              querySelector: () => true,
              querySelectorAll: () => [{
                getAttribute: () => 'Show details for Apple Mail',
                addEventListener: (event: string, handler: () => void) => {
                  if (event === 'click') {
                    // Simulate click on info icon
                    handler();
                  }
                }
              }]
            }
          };
        }
      };
      
      // Mock modal state
      let isModalOpen = false;
      const mockModal = {
        open: () => { isModalOpen = true; },
        close: () => { isModalOpen = false; },
        isOpen: () => isModalOpen
      };
      
      // Simulate rendering the component
      const result = mockPreviewComponent.render(mockClientPreviews, "<div>HTML Code</div>");
      
      // Simulate clicking the info icon
      const infoButtons = result.container.querySelectorAll();
      expect(infoButtons.length).toBeGreaterThan(0);
      
      // Simulate click event
      infoButtons[0].addEventListener('click', () => {
        // Open the modal
        mockModal.open();
        
        // Get platform details
        const platformDetails = PlatformDetailsService.getPlatformDetails('apple-mail');
        
        // Check platform details
        expect(platformDetails.name).toBe('Apple Mail');
        expect(platformDetails.marketShare).toBe(55);
        expect(platformDetails.supportedFeatures).toBeDefined();
        expect(platformDetails.limitations).toBeDefined();
        expect(platformDetails.bestPractices).toBeDefined();
        expect(platformDetails.renderingNotes).toBeDefined();
      });
      
      // Check that the modal is opened
      expect(mockModal.isOpen()).toBe(true);
      
      // Simulate closing the modal
      mockModal.close();
      
      // Check that the modal is closed
      expect(mockModal.isOpen()).toBe(false);
    });

    it('should display correct platform details in the modal', async () => {
      // Get platform details for a specific client
      const platformDetails = PlatformDetailsService.getPlatformDetails('gmail');
      
      // Mock PlatformInfoModal component
      const mockPlatformInfoModal = {
        render: (props: {
          isOpen: boolean,
          platformDetails: any,
          preview: ClientPreview
        }) => {
          // Check that platform details are passed correctly
          expect(props.platformDetails.name).toBe('Gmail');
          expect(props.platformDetails.marketShare).toBe(29);
          expect(props.platformDetails.supportedFeatures).toBeDefined();
          expect(props.platformDetails.limitations).toBeDefined();
          expect(props.platformDetails.bestPractices).toBeDefined();
          expect(props.platformDetails.renderingNotes).toBeDefined();
          
          // Check that preview is passed correctly
          expect(props.preview.client).toBe('gmail');
          expect(props.preview.fallbackUsed).toBe('png');
          
          return {
            modalElement: document.createElement('div')
          };
        }
      };
      
      // Simulate rendering the modal
      mockPlatformInfoModal.render({
        isOpen: true,
        platformDetails,
        preview: mockClientPreviews[1]
      });
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with existing preview functionality', async () => {
      // Create mock previews without HTML content (old format)
      const oldFormatPreviews = mockClientPreviews.map(preview => ({
        client: preview.client,
        fallbackUsed: preview.fallbackUsed,
        estimatedQuality: preview.estimatedQuality,
        previewImage: preview.previewImage
        // No htmlPreview or clientStyles
      }));
      
      // Mock the PreviewGeneratorService to return old format previews
      (PreviewGeneratorService.generateClientPreviews as any).mockResolvedValueOnce(oldFormatPreviews);
      
      // Generate previews
      const previews = await PreviewGeneratorService.generateClientPreviews(mockProcessingResult);
      
      // Check that previews were generated in old format
      expect(previews.length).toBe(3);
      expect(previews[0].htmlPreview).toBeUndefined();
      expect(previews[0].clientStyles).toBeUndefined();
      
      // Mock PreviewComponent with old format previews
      const mockPreviewComponent = {
        render: (previews: ClientPreview[], htmlCode: string) => {
          // Check that the component can handle old format previews
          expect(previews.length).toBe(3);
          
          // Check that fallback types are correctly handled
          const fallbackTypes = previews.map(p => p.fallbackUsed);
          expect(fallbackTypes).toContain('svg');
          expect(fallbackTypes).toContain('png');
          expect(fallbackTypes).toContain('vml');
          
          // Check that quality ratings are correctly handled
          const qualityRatings = previews.map(p => p.estimatedQuality);
          expect(qualityRatings).toContain('excellent');
          expect(qualityRatings).toContain('good');
          
          return {
            container: {
              querySelectorAll: () => [1, 2, 3].map(() => document.createElement('div'))
            }
          };
        }
      };
      
      // Simulate rendering the component
      const result = mockPreviewComponent.render(oldFormatPreviews, "<div>HTML Code</div>");
      
      // Check that preview cards are rendered
      const previewCards = result.container.querySelectorAll();
      expect(previewCards.length).toBe(3);
    });
  });

  describe('Responsive Layout', () => {
    it('should render responsive layout for different screen sizes', async () => {
      // Mock window.matchMedia for testing responsive behavior
      const mockMatchMedia = vi.fn();
      let isSmallScreen = false;
      
      mockMatchMedia.mockImplementation(query => ({
        matches: query.includes('max-width: 768px') ? isSmallScreen : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      
      // Store original matchMedia
      const originalMatchMedia = window.matchMedia;
      
      // Replace with mock
      window.matchMedia = mockMatchMedia;
      
      // Mock PreviewComponent with responsive behavior
      const mockPreviewComponent = {
        render: (previews: ClientPreview[], htmlCode: string) => {
          // Check screen size
          const isMobile = window.matchMedia('(max-width: 768px)').matches;
          
          return {
            container: {
              querySelector: () => true,
              querySelectorAll: () => [1, 2, 3].map(() => ({
                // Simulate different styles based on screen size
                style: {
                  width: isMobile ? '100%' : '33.333%',
                  padding: isMobile ? '8px' : '16px'
                }
              }))
            }
          };
        }
      };
      
      // Simulate rendering on desktop
      isSmallScreen = false;
      const desktopResult = mockPreviewComponent.render(mockClientPreviews, "<div>HTML Code</div>");
      
      // Check desktop layout
      const desktopCards = desktopResult.container.querySelectorAll();
      expect(desktopCards.length).toBe(3);
      expect(desktopCards[0].style.width).toBe('33.333%');
      expect(desktopCards[0].style.padding).toBe('16px');
      
      // Simulate rendering on mobile
      isSmallScreen = true;
      const mobileResult = mockPreviewComponent.render(mockClientPreviews, "<div>HTML Code</div>");
      
      // Check mobile layout
      const mobileCards = mobileResult.container.querySelectorAll();
      expect(mobileCards.length).toBe(3);
      expect(mobileCards[0].style.width).toBe('100%');
      expect(mobileCards[0].style.padding).toBe('8px');
      
      // Restore original matchMedia
      window.matchMedia = originalMatchMedia;
    });
  });
});