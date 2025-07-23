import { ClientPreview, EmailClient, EMAIL_CLIENTS, FallbackType, ProcessingResult, QualityRating } from '@/types';
import APP_CONFIG from '@/config/app-config';
import sharp from 'sharp';
import HTMLTemplateService from './html-template-service';

/**
 * Service for generating email client previews
 */
export class PreviewGeneratorService {
  /**
   * Generate preview data for email clients
   * @param result Processing result containing all fallback data
   * @returns Array of client previews
   */
  static async generateClientPreviews(result: ProcessingResult): Promise<ClientPreview[]> {
    const previews: ClientPreview[] = [];
    
    // Get clients to generate previews for from config
    const clientIds = APP_CONFIG.previews.clients as EmailClient[];
    
    // Generate preview for each client
    for (const clientId of clientIds) {
      const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
      
      if (clientConfig) {
        try {
          // Determine which fallback will be used
          const fallbackUsed = this.determineFallbackType(clientConfig.id, result);
          
          // Estimate quality based on fallback type and client
          const estimatedQuality = this.estimateQuality(fallbackUsed, clientConfig.id, result);
          
          // Generate preview image
          const previewImage = await this.generatePreviewImage(fallbackUsed, result);
          
          // Generate HTML preview
          const htmlPreview = this.generateHtmlPreview(fallbackUsed, result, clientConfig.id);
          
          // Generate client-specific CSS
          const clientStyles = this.generateClientSpecificStyles(clientConfig.id);
          
          // Create preview data
          previews.push({
            client: clientConfig.id,
            fallbackUsed,
            estimatedQuality,
            previewImage,
            htmlPreview,
            clientStyles
          });
        } catch (error) {
          console.error(`Error generating preview for ${clientConfig.id}:`, error);
          
          // Add a basic preview with error information
          previews.push({
            client: clientConfig.id,
            fallbackUsed: 'png', // Default to PNG for errors
            estimatedQuality: 'fair',
            htmlPreview: `<div class="email-preview-error">
              <p>Error generating preview for ${clientConfig.name}</p>
            </div>`,
            clientStyles: this.generateClientSpecificStyles(clientConfig.id)
          });
        }
      }
    }
    
    return previews;
  }
  
  /**
   * Determine which fallback type will be used for a specific client
   * @param clientId Email client ID
   * @param result Processing result
   * @returns Fallback type that will be used
   */
  private static determineFallbackType(clientId: EmailClient, result: ProcessingResult): FallbackType {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return 'png'; // Default to PNG if client not found
    }
    
    // Check if client supports SVG and we have SVG content
    if (clientConfig.supportsSvg && result.optimizedSvg) {
      return 'svg';
    }
    
    // Check if client supports VML and we have VML code
    if (clientConfig.supportsVml && result.vmlCode) {
      return 'vml';
    }
    
    // Default to PNG fallback
    return 'png';
  }
  
  /**
   * Estimate rendering quality based on fallback type and client
   * @param fallbackType Fallback type being used
   * @param clientId Email client ID
   * @param result Processing result
   * @returns Quality rating
   */
  private static estimateQuality(fallbackType: FallbackType, clientId: EmailClient, result: ProcessingResult): QualityRating {
    // Check for warnings that might affect quality
    const hasComplexityWarning = result.warnings.some(w => 
      w.type === 'svg-complexity' && w.severity === 'high'
    );
    
    const hasVmlConversionWarning = result.warnings.some(w => 
      w.type === 'vml-conversion' && w.severity !== 'low'
    );
    
    // SVG provides excellent quality unless there are warnings
    if (fallbackType === 'svg') {
      return hasComplexityWarning ? 'good' : 'excellent';
    }
    
    // VML quality depends on conversion warnings
    if (fallbackType === 'vml') {
      if (hasVmlConversionWarning) {
        return 'fair';
      }
      return hasComplexityWarning ? 'good' : 'excellent';
    }
    
    // PNG quality is generally good
    return 'good';
  }
  
  /**
   * Generate a preview image for the client
   * @param fallbackType Fallback type being used
   * @param result Processing result
   * @returns Buffer containing the preview image or undefined if generation fails
   */
  private static async generatePreviewImage(fallbackType: FallbackType, result: ProcessingResult): Promise<Buffer | undefined> {
    try {
      const { width, height } = APP_CONFIG.previews.dimensions;
      
      // For PNG fallback, use the existing PNG fallback
      if (fallbackType === 'png') {
        // Resize the PNG fallback to preview dimensions
        return await sharp(result.pngFallback)
          .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
      }
      
      // For SVG fallback, render the SVG to PNG at preview dimensions
      if (fallbackType === 'svg' && result.optimizedSvg) {
        return await sharp(Buffer.from(result.optimizedSvg))
          .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .png()
          .toBuffer();
      }
      
      // For VML fallback, use the PNG fallback as we can't render VML directly
      // In a real implementation, you might want to add a VML overlay or indicator
      return await sharp(result.pngFallback)
        .resize(width, height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (error) {
      console.error('Error generating preview image:', error);
      return undefined;
    }
  }
  
  /**
   * Generate text-based preview descriptions
   * @param previews Client previews
   * @returns Array of text descriptions
   */
  static generateTextPreviews(previews: ClientPreview[]): string[] {
    return previews.map(preview => {
      const clientConfig = EMAIL_CLIENTS.find(c => c.id === preview.client);
      const clientName = clientConfig ? clientConfig.name : preview.client;
      
      let fallbackName = '';
      switch (preview.fallbackUsed) {
        case 'svg':
          fallbackName = 'SVG vector';
          break;
        case 'png':
          fallbackName = 'PNG raster';
          break;
        case 'vml':
          fallbackName = 'VML vector';
          break;
      }
      
      return `${clientName}: Will use ${fallbackName} format with ${preview.estimatedQuality} rendering quality.`;
    });
  }
  
  /**
   * Generate HTML preview for a specific client
   * @param fallbackType Fallback type being used
   * @param result Processing result
   * @param clientId Email client ID
   * @returns HTML preview content
   */
  static generateHtmlPreview(fallbackType: FallbackType, result: ProcessingResult, clientId: EmailClient): string {
    // Extract fallback data from processing result
    const fallbackData = {
      svgContent: result.optimizedSvg,
      pngBase64: result.base64DataUri.replace(/^data:image\/png;base64,/, ''),
      vmlCode: result.vmlCode,
      dimensions: {
        // Use actual dimensions from the result if available, otherwise use default preview dimensions
        width: result.originalFile.fileType === 'svg' ? 
          (result.metadata?.dimensions?.width || APP_CONFIG.previews.dimensions.width) : 
          APP_CONFIG.previews.dimensions.width,
        height: result.originalFile.fileType === 'svg' ? 
          (result.metadata?.dimensions?.height || APP_CONFIG.previews.dimensions.height) : 
          APP_CONFIG.previews.dimensions.height
      },
      altText: 'Logo Preview'
    };
    
    // Select appropriate fallback based on client and fallback type
    let htmlContent = '';
    
    // For clients that support SVG and we're using SVG fallback
    if (fallbackType === 'svg' && fallbackData.svgContent) {
      // Generate HTML with SVG prioritized
      htmlContent = HTMLTemplateService.generateEmailHtml({
        ...fallbackData,
        // For preview purposes, we'll only include the SVG content
        vmlCode: undefined
      });
    } 
    // For clients that support VML and we're using VML fallback
    else if (fallbackType === 'vml' && fallbackData.vmlCode) {
      // Generate HTML with VML prioritized
      htmlContent = HTMLTemplateService.generateEmailHtml({
        ...fallbackData,
        // For preview purposes, we'll only include the VML content
        svgContent: undefined
      });
    } 
    // For all other cases, use PNG fallback
    else {
      // Generate HTML with only PNG fallback
      htmlContent = HTMLTemplateService.generateEmailHtml({
        ...fallbackData,
        svgContent: undefined,
        vmlCode: undefined
      });
    }
    
    // Get client-specific rendering environment
    const clientEnv = this.getClientRenderingEnvironment(clientId);
    
    // Wrap the HTML in a client-specific container with rendering environment
    return `<div class="email-preview email-preview-${clientId}" style="width: 100%; height: 100%;">
      <div class="email-client-chrome" style="border-radius: 4px; overflow: hidden;">
        ${clientEnv.header}
        <div class="email-client-content" style="padding: 10px; background-color: ${clientEnv.backgroundColor};">
          ${htmlContent}
        </div>
        ${clientEnv.footer}
      </div>
    </div>`;
  }
  
  /**
   * Get client-specific rendering environment for preview
   * @param clientId Email client ID
   * @returns Client environment with header, footer, and background color
   */
  private static getClientRenderingEnvironment(clientId: EmailClient): { 
    header: string; 
    footer: string; 
    backgroundColor: string;
  } {
    switch (clientId) {
      case 'apple-mail':
        return {
          header: `<div class="email-client-header" style="background-color: #f5f5f5; padding: 8px; border-bottom: 1px solid #ddd;">
            <div style="font-family: 'SF Pro', 'Helvetica Neue', sans-serif; font-size: 14px; color: #333;">Apple Mail</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
        
      case 'gmail':
        return {
          header: `<div class="email-client-header" style="background-color: #f2f2f2; padding: 8px; border-bottom: 1px solid #e5e5e5;">
            <div style="font-family: 'Arial', sans-serif; font-size: 14px; color: #444;">Gmail</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
        
      case 'outlook-desktop':
        return {
          header: `<div class="email-client-header" style="background-color: #0078d4; padding: 8px; border-bottom: 1px solid #ccc;">
            <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #ffffff;">Outlook</div>
          </div>`,
          footer: '',
          backgroundColor: '#f9f9f9'
        };
        
      case 'outlook-web':
        return {
          header: `<div class="email-client-header" style="background-color: #0078d4; padding: 8px; border-bottom: 1px solid #ccc;">
            <div style="font-family: 'Segoe UI', sans-serif; font-size: 14px; color: #ffffff;">Outlook Web</div>
          </div>`,
          footer: '',
          backgroundColor: '#f8f8f8'
        };
        
      case 'yahoo':
        return {
          header: `<div class="email-client-header" style="background-color: #6001d2; padding: 8px; border-bottom: 1px solid #ddd;">
            <div style="font-family: 'Helvetica Neue', Helvetica, sans-serif; font-size: 14px; color: #ffffff;">Yahoo Mail</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
        
      case 'thunderbird':
        return {
          header: `<div class="email-client-header" style="background-color: #eeeeee; padding: 8px; border-bottom: 1px solid #ddd;">
            <div style="font-family: 'Helvetica', sans-serif; font-size: 14px; color: #333;">Thunderbird</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
        
      case 'samsung-mail':
        return {
          header: `<div class="email-client-header" style="background-color: #1a73e8; padding: 8px; border-bottom: 1px solid #ddd;">
            <div style="font-family: 'Roboto', sans-serif; font-size: 14px; color: #ffffff;">Samsung Mail</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
        
      default:
        return {
          header: `<div class="email-client-header" style="background-color: #f5f5f5; padding: 8px; border-bottom: 1px solid #ddd;">
            <div style="font-family: sans-serif; font-size: 14px; color: #333;">Email Client</div>
          </div>`,
          footer: '',
          backgroundColor: '#ffffff'
        };
    }
  }
  
  /**
   * Generate client-specific CSS for email preview
   * @param clientId Email client ID
   * @returns CSS styles as string
   */
  static generateClientSpecificStyles(clientId: EmailClient): string {
    // Base styles for all email previews
    const baseStyles = `
      .email-preview {
        font-family: sans-serif;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      
      .email-client-chrome {
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .email-client-header {
        display: flex;
        align-items: center;
      }
      
      .email-client-content {
        min-height: 150px;
      }
      
      /* Responsive adjustments */
      @media (max-width: 768px) {
        .email-client-header {
          padding: 6px !important;
        }
        
        .email-client-content {
          padding: 8px !important;
        }
      }
    `;
    
    // Client-specific styles
    switch (clientId) {
      case 'outlook-desktop':
        return `${baseStyles}
          /* Outlook Desktop limitations */
          .email-preview-outlook-desktop {
            font-family: 'Calibri', sans-serif;
          }
          
          /* Outlook Desktop UI */
          .email-preview-outlook-desktop .email-client-header {
            background-color: #0078d4;
            color: #ffffff;
          }
          
          /* Disable unsupported CSS */
          .email-preview-outlook-desktop .email-client-content * {
            border-radius: 0 !important;
            box-shadow: none !important;
            text-shadow: none !important;
            animation: none !important;
            transition: none !important;
          }
          
          /* Force table-based layouts */
          .email-preview-outlook-desktop .email-client-content div:not(.wrapper) {
            display: block !important;
          }
          
          /* Outlook uses Word rendering engine */
          .email-preview-outlook-desktop .email-client-content {
            font-family: 'Calibri', sans-serif !important;
            line-height: 1.4 !important;
          }
          
          /* No flexbox support */
          .email-preview-outlook-desktop .email-client-content [style*="display: flex"],
          .email-preview-outlook-desktop .email-client-content [style*="display:flex"] {
            display: block !important;
          }
        `;
        
      case 'gmail':
        return `${baseStyles}
          /* Gmail limitations */
          .email-preview-gmail {
            font-family: 'Arial', sans-serif;
          }
          
          /* Gmail UI */
          .email-preview-gmail .email-client-header {
            background-color: #f2f2f2;
            color: #444444;
          }
          
          /* Gmail strips head CSS */
          .email-preview-gmail .email-client-content style, 
          .email-preview-gmail .email-client-content link {
            display: none !important;
          }
          
          /* Gmail doesn't support CSS position */
          .email-preview-gmail .email-client-content [style*="position: absolute"],
          .email-preview-gmail .email-client-content [style*="position:absolute"],
          .email-preview-gmail .email-client-content [style*="position: fixed"],
          .email-preview-gmail .email-client-content [style*="position:fixed"] {
            position: static !important;
          }
          
          /* Gmail doesn't support external CSS */
          .email-preview-gmail .email-client-content link[rel="stylesheet"] {
            display: none !important;
          }
          
          /* Gmail has limited support for CSS3 */
          .email-preview-gmail .email-client-content * {
            transform: none !important;
            text-shadow: none !important;
          }
        `;
        
      case 'apple-mail':
        return `${baseStyles}
          /* Apple Mail - modern support */
          .email-preview-apple-mail {
            font-family: 'SF Pro', 'Helvetica Neue', sans-serif;
          }
          
          /* Apple Mail UI */
          .email-preview-apple-mail .email-client-header {
            background-color: #f5f5f5;
            color: #333333;
          }
          
          /* Apple Mail supports most modern CSS */
          .email-preview-apple-mail .email-client-content {
            font-family: 'SF Pro', 'Helvetica Neue', sans-serif !important;
          }
          
          /* Limited support for some CSS filters */
          .email-preview-apple-mail .email-client-content [style*="filter:"],
          .email-preview-apple-mail .email-client-content [style*="filter:"] {
            filter: none !important;
          }
        `;
        
      case 'outlook-web':
        return `${baseStyles}
          /* Outlook Web App */
          .email-preview-outlook-web {
            font-family: 'Segoe UI', sans-serif;
          }
          
          /* Outlook Web UI */
          .email-preview-outlook-web .email-client-header {
            background-color: #0078d4;
            color: #ffffff;
          }
          
          /* Limited CSS support */
          .email-preview-outlook-web .email-client-content * {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          /* Limited flexbox support */
          .email-preview-outlook-web .email-client-content [style*="display: flex"],
          .email-preview-outlook-web .email-client-content [style*="display:flex"] {
            display: block !important;
          }
        `;
        
      case 'yahoo':
        return `${baseStyles}
          /* Yahoo Mail */
          .email-preview-yahoo {
            font-family: 'Helvetica Neue', Helvetica, sans-serif;
          }
          
          /* Yahoo UI */
          .email-preview-yahoo .email-client-header {
            background-color: #6001d2;
            color: #ffffff;
          }
          
          /* Limited CSS support */
          .email-preview-yahoo .email-client-content * {
            position: static !important;
          }
          
          /* Yahoo strips some CSS properties */
          .email-preview-yahoo .email-client-content [style*="float:"],
          .email-preview-yahoo .email-client-content [style*="float:"] {
            float: none !important;
          }
          
          /* Limited support for advanced selectors */
          .email-preview-yahoo .email-client-content > * + * {
            margin-top: 1em !important;
          }
        `;
        
      case 'thunderbird':
        return `${baseStyles}
          /* Thunderbird */
          .email-preview-thunderbird {
            font-family: 'Helvetica', sans-serif;
          }
          
          /* Thunderbird UI */
          .email-preview-thunderbird .email-client-header {
            background-color: #eeeeee;
            color: #333333;
          }
          
          /* Thunderbird has good CSS support */
          .email-preview-thunderbird .email-client-content {
            font-family: 'Helvetica', sans-serif !important;
          }
        `;
        
      case 'samsung-mail':
        return `${baseStyles}
          /* Samsung Mail */
          .email-preview-samsung-mail {
            font-family: 'Roboto', sans-serif;
          }
          
          /* Samsung Mail UI */
          .email-preview-samsung-mail .email-client-header {
            background-color: #1a73e8;
            color: #ffffff;
          }
          
          /* Samsung Mail has inconsistent CSS support */
          .email-preview-samsung-mail .email-client-content * {
            position: static !important;
            float: none !important;
          }
        `;
        
      default:
        return `${baseStyles}
          /* Generic email client */
          .email-client-header {
            background-color: #f5f5f5;
            color: #333333;
          }
        `;
    }
  }
}

export default PreviewGeneratorService;