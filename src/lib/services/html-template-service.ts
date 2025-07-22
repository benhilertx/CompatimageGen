import { FallbackData } from '../../types';
import APP_CONFIG from '../../config/app-config';

/**
 * Service for generating HTML templates with layered fallbacks for email clients
 */
export class HTMLTemplateService {
  /**
   * Generate a complete HTML code block with layered fallbacks for email clients
   * @param fallbackData Data for generating fallbacks
   * @returns HTML code block as string
   */
  static generateEmailHtml(fallbackData: FallbackData): string {
    const { svgContent, pngBase64, vmlCode, dimensions, altText } = fallbackData;
    const { width, height } = dimensions;
    
    // Start building the HTML
    let html = '';
    const indent = ' '.repeat(APP_CONFIG.output.html.indentation);
    
    // Add comments if enabled
    if (APP_CONFIG.output.html.includeComments) {
      html += '<!-- CompatimageGen Email Logo - Begin -->\n';
      html += '<!-- This code includes fallbacks for all major email clients -->\n';
    }
    
    // Create the responsive wrapper
    html += this.createResponsiveWrapper(
      // VML for Outlook (if available)
      (vmlCode ? vmlCode + '\n' : '') +
      
      // SVG for modern clients (if available)
      (svgContent ? this.wrapSvgForEmailClients(svgContent, width, height, altText) + '\n' : '') +
      
      // PNG fallback for all clients
      this.createPngFallback(pngBase64, width, height, altText),
      
      width,
      height
    );
    
    // Add closing comment if enabled
    if (APP_CONFIG.output.html.includeComments) {
      html += '<!-- CompatimageGen Email Logo - End -->\n';
    }
    
    return html;
  }
  
  /**
   * Create a responsive wrapper for the email content
   * @param content HTML content to wrap
   * @param width Content width
   * @param height Content height
   * @returns Wrapped HTML
   */
  static createResponsiveWrapper(content: string, width: number, height: number): string {
    // Calculate aspect ratio for responsive scaling
    const aspectRatio = (height / width) * 100;
    
    return `<div style="max-width: ${width}px; margin: 0 auto;">
  <div style="height: 0; padding-bottom: ${aspectRatio}%; position: relative;">
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
${content}
    </div>
  </div>
</div>`;
  }
  
  /**
   * Wrap SVG content for email clients
   * @param svgContent SVG content as string
   * @param width SVG width
   * @param height SVG height
   * @param altText Alternative text for accessibility
   * @returns Wrapped SVG with conditional comments
   */
  private static wrapSvgForEmailClients(svgContent: string, width: number, height: number, altText: string): string {
    // Add conditional comments to hide from Outlook
    return `<!--[if !mso]><!-->
  <div style="display: block; width: 100%; height: 100%;">
    ${this.addAccessibilityAttributes(svgContent, altText)}
  </div>
<!--<![endif]-->`;
  }
  
  /**
   * Create PNG fallback image
   * @param pngBase64 PNG as base64 data URI
   * @param width Image width
   * @param height Image height
   * @param altText Alternative text for accessibility
   * @returns HTML for PNG fallback
   */
  private static createPngFallback(pngBase64: string, width: number, height: number, altText: string): string {
    // Create image with base64 data URI
    return `<!--[if !vml]><!-->
  <img src="data:image/png;base64,${pngBase64}" 
    width="${width}" 
    height="${height}" 
    alt="${this.escapeHtml(altText)}" 
    style="display: block; width: 100%; height: auto; max-width: 100%;" 
    role="img" 
    aria-label="${this.escapeHtml(altText)}">
<!--<![endif]-->`;
  }
  
  /**
   * Add accessibility attributes to HTML content
   * @param html HTML content
   * @param altText Alternative text for accessibility
   * @returns HTML with accessibility attributes
   */
  static addAccessibilityAttributes(html: string, altText: string): string {
    // For SVG, add title and aria attributes
    if (html.includes('<svg')) {
      // Check if SVG already has a title element
      if (!html.includes('<title>')) {
        // Add title element after opening svg tag
        html = html.replace(/<svg([^>]*)>/, `<svg$1><title>${this.escapeHtml(altText)}</title>`);
      }
      
      // Add aria attributes to svg tag
      html = html.replace(/<svg([^>]*)>/, `<svg$1 role="img" aria-label="${this.escapeHtml(altText)}">`);
    }
    
    return html;
  }
  
  /**
   * Escape HTML special characters
   * @param text Text to escape
   * @returns Escaped text
   */
  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Validate HTML for email client compatibility
   * @param html HTML to validate
   * @returns Validation result with warnings
   */
  static validateHtml(html: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    
    // Check for external resources
    if (html.includes('http://') || html.includes('https://')) {
      warnings.push('HTML contains external URLs which may not work in all email clients');
    }
    
    // Check for script tags
    if (html.includes('<script')) {
      warnings.push('HTML contains script tags which will be stripped by email clients');
    }
    
    // Check for CSS that might not be supported
    if (html.includes('@media') || html.includes('@import')) {
      warnings.push('HTML contains CSS media queries or imports which have limited support in email clients');
    }
    
    // Check for potentially unsupported HTML5 elements
    const html5Elements = ['article', 'section', 'nav', 'aside', 'header', 'footer', 'video', 'audio', 'canvas'];
    for (const element of html5Elements) {
      if (html.includes(`<${element}`)) {
        warnings.push(`HTML contains ${element} element which may not be supported in all email clients`);
      }
    }
    
    return {
      valid: warnings.length === 0,
      warnings
    };
  }
}

export default HTMLTemplateService;