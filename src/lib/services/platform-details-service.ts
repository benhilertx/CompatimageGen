import { EmailClient, EMAIL_CLIENTS, FallbackType, PlatformDetails } from '@/types';

/**
 * Service for providing detailed information about email platforms
 */
export class PlatformDetailsService {
  /**
   * Get detailed information about an email platform
   * @param clientId Email client ID
   * @returns Platform details including capabilities and limitations
   */
  static getPlatformDetails(clientId: EmailClient): PlatformDetails {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return this.getDefaultPlatformDetails(clientId);
    }
    
    return {
      name: clientConfig.name,
      marketShare: clientConfig.marketShare,
      supportedFeatures: this.getSupportedFeatures(clientId),
      limitations: this.getLimitations(clientId),
      bestPractices: this.getBestPractices(clientId),
      renderingNotes: this.getGeneralRenderingNotes(clientId)
    };
  }
  
  /**
   * Get fallback-specific rendering notes for a platform
   * @param clientId Email client ID
   * @param fallbackType Type of fallback being used
   * @returns Rendering notes specific to the fallback type
   */
  static getPlatformRenderingNotes(clientId: EmailClient, fallbackType: FallbackType): string {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return 'No specific rendering information available for this client.';
    }
    
    switch (fallbackType) {
      case 'svg':
        return this.getSvgRenderingNotes(clientId);
      case 'png':
        return this.getPngRenderingNotes(clientId);
      case 'vml':
        return this.getVmlRenderingNotes(clientId);
      default:
        return 'No specific rendering information available for this fallback type.';
    }
  }
  
  /**
   * Get default platform details for unknown clients
   * @param clientId Email client ID
   * @returns Default platform details
   */
  private static getDefaultPlatformDetails(clientId: EmailClient): PlatformDetails {
    return {
      name: clientId,
      marketShare: 0,
      supportedFeatures: [],
      limitations: ['Unknown client capabilities'],
      bestPractices: ['Use PNG fallback for maximum compatibility'],
      renderingNotes: 'No specific rendering information available for this client.'
    };
  }
  
  /**
   * Get supported features for a specific email client
   * @param clientId Email client ID
   * @returns Array of supported features
   */
  private static getSupportedFeatures(clientId: EmailClient): string[] {
    const baseFeatures = [
      'Basic HTML',
      'Inline CSS',
      'Images with alt text'
    ];
    
    switch (clientId) {
      case 'apple-mail':
        return [
          ...baseFeatures,
          'SVG images',
          'CSS3 properties',
          'Media queries',
          'Web fonts',
          'CSS animations',
          'Flexbox layout'
        ];
        
      case 'gmail':
        return [
          ...baseFeatures,
          'Responsive design (with limitations)',
          'Limited CSS properties',
          'Embedded images',
          'Basic interactivity via AMP for Email'
        ];
        
      case 'outlook-desktop':
        return [
          ...baseFeatures,
          'VML graphics',
          'Microsoft Office styles',
          'Conditional comments',
          'Table-based layouts'
        ];
        
      case 'outlook-web':
        return [
          ...baseFeatures,
          'Modern CSS (with limitations)',
          'Table-based layouts',
          'Conditional comments',
          'VML graphics'
        ];
        
      case 'yahoo':
        return [
          ...baseFeatures,
          'Table-based layouts',
          'Basic CSS properties',
          'Media queries (limited support)'
        ];
        
      case 'thunderbird':
        return [
          ...baseFeatures,
          'SVG images',
          'Modern CSS properties',
          'Web fonts',
          'CSS animations',
          'Flexbox layout'
        ];
        
      case 'samsung-mail':
        return [
          ...baseFeatures,
          'Modern CSS properties',
          'Media queries',
          'Web fonts (with limitations)'
        ];
        
      default:
        return baseFeatures;
    }
  }
  
  /**
   * Get limitations for a specific email client
   * @param clientId Email client ID
   * @returns Array of limitations
   */
  private static getLimitations(clientId: EmailClient): string[] {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    const baseLimitations = clientConfig?.cssLimitations || [];
    
    switch (clientId) {
      case 'apple-mail':
        return [
          ...baseLimitations,
          'Limited support for CSS filters',
          'Some CSS animations may not work consistently'
        ];
        
      case 'gmail':
        return [
          ...baseLimitations,
          'No support for SVG images',
          'Strips <style> tags in <head>',
          'Limited CSS positioning',
          'No external stylesheets',
          'Removes some HTML attributes'
        ];
        
      case 'outlook-desktop':
        return [
          ...baseLimitations,
          'No support for SVG images',
          'Limited CSS support (uses Word rendering engine)',
          'No border-radius',
          'No CSS float',
          'No background images (unreliable)',
          'No flexbox or grid layouts'
        ];
        
      case 'outlook-web':
        return [
          ...baseLimitations,
          'No support for SVG images',
          'Limited CSS support',
          'No border-radius',
          'Inconsistent rendering between versions'
        ];
        
      case 'yahoo':
        return [
          ...baseLimitations,
          'No support for SVG images',
          'Removes CSS position property',
          'Limited support for advanced CSS selectors',
          'Inconsistent media query support'
        ];
        
      case 'thunderbird':
        return [
          ...baseLimitations,
          'Some CSS3 features may render inconsistently'
        ];
        
      case 'samsung-mail':
        return [
          ...baseLimitations,
          'No support for SVG images',
          'Inconsistent CSS support across versions',
          'Limited positioning capabilities'
        ];
        
      default:
        return [
          'Limited CSS support',
          'No SVG support',
          'No advanced layout features'
        ];
    }
  }
  
  /**
   * Get best practices for a specific email client
   * @param clientId Email client ID
   * @returns Array of best practices
   */
  private static getBestPractices(clientId: EmailClient): string[] {
    const baseRecommendations = [
      'Always include alt text for accessibility',
      'Test thoroughly before sending'
    ];
    
    switch (clientId) {
      case 'apple-mail':
        return [
          ...baseRecommendations,
          'Use SVG for vector graphics',
          'Take advantage of modern CSS features',
          'Optimize images for Retina displays'
        ];
        
      case 'gmail':
        return [
          ...baseRecommendations,
          'Use inline CSS for styling',
          'Keep table-based layouts simple',
          'Provide PNG fallback images',
          'Avoid complex CSS selectors',
          'Use responsive design techniques compatible with Gmail'
        ];
        
      case 'outlook-desktop':
        return [
          ...baseRecommendations,
          'Use VML for vector graphics',
          'Use table-based layouts',
          'Use conditional comments for Outlook-specific code',
          'Avoid CSS properties not supported by Word rendering engine',
          'Test across multiple Outlook versions'
        ];
        
      case 'outlook-web':
        return [
          ...baseRecommendations,
          'Use table-based layouts for consistency',
          'Test across different Outlook Web versions',
          'Use conditional comments for Outlook-specific code'
        ];
        
      case 'yahoo':
        return [
          ...baseRecommendations,
          'Use table-based layouts',
          'Avoid position CSS property',
          'Use simple CSS selectors',
          'Test thoroughly as rendering can be inconsistent'
        ];
        
      case 'thunderbird':
        return [
          ...baseRecommendations,
          'Use SVG for vector graphics',
          'Take advantage of modern CSS features',
          'Consider users may have custom style settings'
        ];
        
      case 'samsung-mail':
        return [
          ...baseRecommendations,
          'Use table-based layouts for consistency',
          'Test on multiple Samsung devices',
          'Provide PNG fallback images'
        ];
        
      default:
        return [
          ...baseRecommendations,
          'Use PNG fallback for maximum compatibility',
          'Keep layouts simple and table-based'
        ];
    }
  }
  
  /**
   * Get general rendering notes for a specific email client
   * @param clientId Email client ID
   * @returns General rendering notes
   */
  private static getGeneralRenderingNotes(clientId: EmailClient): string {
    switch (clientId) {
      case 'apple-mail':
        return 'Apple Mail offers excellent rendering capabilities with support for modern web standards. It can display SVG images natively, making it ideal for vector logos.';
        
      case 'gmail':
        return 'Gmail strips out <head> and <style> tags, requiring inline CSS. It does not support SVG images, so PNG fallbacks will be used. Gmail has good but limited CSS support.';
        
      case 'outlook-desktop':
        return 'Outlook Desktop uses Microsoft Word as its rendering engine, which has limited support for modern CSS. It supports VML for vector graphics but not SVG. Expect significant rendering differences compared to web browsers.';
        
      case 'outlook-web':
        return 'Outlook Web App has better CSS support than desktop Outlook but still lacks support for many modern features. It does not support SVG images but can use VML for vector graphics in some versions.';
        
      case 'yahoo':
        return 'Yahoo Mail removes the position CSS property and has limited support for advanced selectors. It does not support SVG images, so PNG fallbacks will be used.';
        
      case 'thunderbird':
        return 'Thunderbird has excellent support for modern web standards, including SVG images. It renders emails similar to standard web browsers.';
        
      case 'samsung-mail':
        return 'Samsung Mail has inconsistent rendering across different versions. It does not support SVG images, so PNG fallbacks will be used. Table-based layouts are recommended for consistency.';
        
      default:
        return 'This email client has unknown rendering capabilities. For maximum compatibility, PNG fallbacks and simple table-based layouts are recommended.';
    }
  }
  
  /**
   * Get SVG-specific rendering notes for a client
   * @param clientId Email client ID
   * @returns SVG rendering notes
   */
  private static getSvgRenderingNotes(clientId: EmailClient): string {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return 'SVG support information is not available for this client.';
    }
    
    if (clientConfig.supportsSvg) {
      switch (clientId) {
        case 'apple-mail':
          return 'Apple Mail has excellent SVG support. Your logo will render as a crisp vector graphic at any size. All SVG features including gradients, masks, and filters are supported.';
          
        case 'thunderbird':
          return 'Thunderbird has good SVG support. Your logo will render as a vector graphic, maintaining quality at any size. Most SVG features are supported, though some complex filters may render inconsistently.';
          
        default:
          return 'This client supports SVG. Your logo will render as a vector graphic, maintaining quality at any size.';
      }
    } else {
      return `${clientConfig.name} does not support SVG images. A PNG fallback will be used instead.`;
    }
  }
  
  /**
   * Get PNG-specific rendering notes for a client
   * @param clientId Email client ID
   * @returns PNG rendering notes
   */
  private static getPngRenderingNotes(clientId: EmailClient): string {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return 'PNG support information is not available for this client.';
    }
    
    switch (clientId) {
      case 'gmail':
        return 'Gmail has good support for PNG images. Your logo will render as a raster image with good quality. For best results, ensure your PNG is optimized and sized appropriately for its intended use.';
        
      case 'yahoo':
        return 'Yahoo Mail supports PNG images well. Your logo will render as a raster image with good quality. Consider using a slightly higher resolution to account for various display sizes.';
        
      case 'samsung-mail':
        return 'Samsung Mail has good support for PNG images across all versions. Your logo will render consistently as a raster image.';
        
      default:
        return 'This client supports PNG images well. Your logo will render as a raster image with good quality.';
    }
  }
  
  /**
   * Get VML-specific rendering notes for a client
   * @param clientId Email client ID
   * @returns VML rendering notes
   */
  private static getVmlRenderingNotes(clientId: EmailClient): string {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      return 'VML support information is not available for this client.';
    }
    
    if (clientConfig.supportsVml) {
      switch (clientId) {
        case 'outlook-desktop':
          return 'Outlook Desktop has good support for VML graphics. Your logo will render as a vector graphic using Microsoft\'s Vector Markup Language. While not as versatile as SVG, VML allows for scalable graphics in Outlook. Complex SVG features may be simplified in the VML conversion.';
          
        case 'outlook-web':
          return 'Outlook Web has limited support for VML graphics. Your logo will render as a vector graphic using Microsoft\'s Vector Markup Language, but rendering may vary between versions. Complex SVG features will be simplified in the VML conversion.';
          
        default:
          return 'This client supports VML. Your logo will render as a vector graphic using Microsoft\'s Vector Markup Language.';
      }
    } else {
      return `${clientConfig.name} does not support VML. A PNG fallback will be used instead.`;
    }
  }
}

export default PlatformDetailsService;