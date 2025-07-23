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
   * @returns Buffer containing the preview image
   */
  private static async generatePreviewImage(fallbackType: FallbackType, result: ProcessingResult): Promise<Buffer> {
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
        width: result.originalFile.fileType === 'svg' ? 200 : 200, // Default preview width
        height: result.originalFile.fileType === 'svg' ? 200 : 200 // Default preview height
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
    
    // Wrap the HTML in a client-specific container
    return `<div class="email-preview email-preview-${clientId}">
      ${htmlContent}
    </div>`;
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
        padding: 10px;
        background-color: #ffffff;
        border-radius: 4px;
        overflow: hidden;
      }
    `;
    
    // Client-specific styles
    switch (clientId) {
      case 'outlook-desktop':
        return `${baseStyles}
          /* Outlook Desktop limitations */
          .email-preview-outlook-desktop {
            font-family: 'Calibri', sans-serif;
            background-color: #f9f9f9;
          }
          /* Disable unsupported CSS */
          .email-preview-outlook-desktop * {
            border-radius: 0 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
        `;
        
      case 'gmail':
        return `${baseStyles}
          /* Gmail limitations */
          .email-preview-gmail {
            font-family: 'Arial', sans-serif;
            background-color: #ffffff;
          }
          /* Gmail strips head CSS */
          .email-preview-gmail style, 
          .email-preview-gmail link {
            display: none !important;
          }
        `;
        
      case 'apple-mail':
        return `${baseStyles}
          /* Apple Mail - modern support */
          .email-preview-apple-mail {
            font-family: 'SF Pro', 'Helvetica Neue', sans-serif;
            background-color: #ffffff;
          }
        `;
        
      case 'outlook-web':
        return `${baseStyles}
          /* Outlook Web App */
          .email-preview-outlook-web {
            font-family: 'Segoe UI', sans-serif;
            background-color: #f8f8f8;
          }
          /* Limited CSS support */
          .email-preview-outlook-web * {
            border-radius: 0 !important;
          }
        `;
        
      case 'yahoo':
        return `${baseStyles}
          /* Yahoo Mail */
          .email-preview-yahoo {
            font-family: 'Helvetica Neue', Helvetica, sans-serif;
            background-color: #ffffff;
          }
          /* Limited CSS support */
          .email-preview-yahoo * {
            position: static !important;
          }
        `;
        
      default:
        return baseStyles;
    }
  }
}

export default PreviewGeneratorService;