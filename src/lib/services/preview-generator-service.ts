import { ClientPreview, EmailClient, EMAIL_CLIENTS, FallbackType, ProcessingResult, QualityRating } from '@/types';
import APP_CONFIG from '@/config/app-config';
import sharp from 'sharp';

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
        
        // Create preview data
        previews.push({
          client: clientConfig.id,
          fallbackUsed,
          estimatedQuality,
          previewImage
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
}

export default PreviewGeneratorService;