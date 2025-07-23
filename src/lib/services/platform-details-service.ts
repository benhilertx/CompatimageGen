import { EmailClient, EMAIL_CLIENTS, FallbackType, PlatformDetails } from '@/types';

/**
 * Service for providing detailed information about email platforms
 */
export class PlatformDetailsService {
  /**
   * Get detailed information about an email platform
   * @param clientId Email client ID
   * @returns Platform details
   */
  static getPlatformDetails(clientId: EmailClient): PlatformDetails {
    const clientConfig = EMAIL_CLIENTS.find(c => c.id === clientId);
    
    if (!clientConfig) {
      throw new Error(`Client configuration not found for ${clientId}`);
    }
    
    // Return platform details based on client ID
    switch (clientId) {
      case 'apple-mail':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'SVG images',
            'Modern CSS properties',
            'Responsive design',
            'Web fonts',
            'CSS animations (limited)',
          ],
          limitations: [
            'Limited support for CSS filters',
            'Some CSS animations may not work',
            'No support for JavaScript',
          ],
          bestPractices: [
            'Use SVG for vector graphics',
            'Test animations thoroughly',
            'Provide fallbacks for advanced CSS features',
          ],
          renderingNotes: 'Apple Mail has excellent support for modern HTML and CSS, making it one of the best email clients for rendering complex designs. SVG images are fully supported.'
        };
        
      case 'gmail':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'Basic HTML',
            'Inline CSS',
            'Media queries (limited)',
            'Web fonts (limited)',
          ],
          limitations: [
            'No SVG support',
            'Limited CSS positioning',
            'No external stylesheets',
            'Strips <style> tags in head',
            'Limited support for CSS properties',
          ],
          bestPractices: [
            'Use inline CSS',
            'Keep table-based layouts simple',
            'Provide PNG fallbacks for vector graphics',
            'Test thoroughly as rendering can vary',
          ],
          renderingNotes: 'Gmail strips out <style> tags and has limited support for CSS. It does not support SVG, so PNG fallbacks are always used. Despite limitations, it generally provides good rendering quality for images.'
        };
        
      case 'outlook-desktop':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'VML for vector graphics',
            'Basic HTML tables',
            'Simple inline CSS',
            'Microsoft-specific conditional comments',
          ],
          limitations: [
            'No SVG support',
            'No support for many CSS properties',
            'No border-radius',
            'No CSS flexbox or grid',
            'Uses Word rendering engine',
          ],
          bestPractices: [
            'Use VML for vector graphics',
            'Use simple table-based layouts',
            'Test thoroughly with each Outlook version',
            'Use Microsoft-specific conditional comments',
          ],
          renderingNotes: 'Outlook Desktop uses Microsoft Word as its rendering engine, which has very limited HTML and CSS support. It requires VML for vector graphics and has many CSS limitations.'
        };
        
      case 'outlook-web':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'Modern HTML (improving)',
            'Basic CSS properties',
            'VML for vector graphics',
          ],
          limitations: [
            'No SVG support',
            'Limited CSS support',
            'Inconsistent rendering between versions',
          ],
          bestPractices: [
            'Use VML for vector graphics',
            'Keep layouts simple',
            'Test across different versions',
          ],
          renderingNotes: 'Outlook Web App has better rendering than Outlook Desktop but still has significant limitations. It uses VML for vector graphics and has improved in recent versions.'
        };
        
      case 'yahoo':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'Basic HTML',
            'Simple CSS properties',
            'Media queries (limited)',
          ],
          limitations: [
            'No SVG support',
            'Limited CSS support',
            'Strips some CSS properties',
            'No advanced selectors',
          ],
          bestPractices: [
            'Use table-based layouts',
            'Keep CSS simple',
            'Use inline styles',
            'Provide PNG fallbacks',
          ],
          renderingNotes: 'Yahoo Mail has limited support for modern HTML and CSS. It does not support SVG, so PNG fallbacks are always used. It strips some CSS properties and has inconsistent rendering.'
        };
        
      case 'thunderbird':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'SVG images',
            'Modern CSS properties',
            'Web fonts',
            'CSS animations',
          ],
          limitations: [
            'Some inconsistencies with web standards',
            'Limited support for advanced CSS',
          ],
          bestPractices: [
            'Use SVG for vector graphics',
            'Test with latest version',
            'Follow web standards',
          ],
          renderingNotes: 'Thunderbird has good support for modern HTML and CSS, including SVG images. It generally follows web standards and provides good rendering quality.'
        };
        
      case 'samsung-mail':
        return {
          name: clientConfig.name,
          marketShare: clientConfig.marketShare,
          supportedFeatures: [
            'Basic HTML',
            'Simple CSS properties',
            'Media queries (limited)',
          ],
          limitations: [
            'No SVG support',
            'Limited CSS support',
            'Inconsistent rendering',
          ],
          bestPractices: [
            'Use simple layouts',
            'Provide PNG fallbacks',
            'Test on actual devices',
          ],
          renderingNotes: 'Samsung Mail has limited support for modern HTML and CSS. It does not support SVG, so PNG fallbacks are always used. Testing on actual devices is recommended.'
        };
        
      default:
        return {
          name: clientConfig?.name || 'Unknown Client',
          marketShare: clientConfig?.marketShare || 0,
          supportedFeatures: [
            'Basic HTML',
            'Simple CSS properties',
          ],
          limitations: [
            'Support varies widely',
            'Limited CSS support',
            'Inconsistent rendering',
          ],
          bestPractices: [
            'Use simple layouts',
            'Provide PNG fallbacks',
            'Test thoroughly',
          ],
          renderingNotes: 'Support varies widely among email clients. Using simple layouts and providing PNG fallbacks is recommended for maximum compatibility.'
        };
    }
  }
  
  /**
   * Get rendering notes specific to a fallback type for a client
   * @param clientId Email client ID
   * @param fallbackType Fallback type being used
   * @returns Rendering notes specific to the fallback
   */
  static getPlatformRenderingNotes(clientId: EmailClient, fallbackType: FallbackType): string {
    switch (clientId) {
      case 'apple-mail':
        if (fallbackType === 'svg') {
          return 'Your logo will render as SVG in Apple Mail, providing excellent quality at any size with crisp edges.';
        } else if (fallbackType === 'png') {
          return 'Your logo will render as PNG in Apple Mail. While Apple Mail supports SVG, a PNG fallback is being used, which may appear pixelated at larger sizes.';
        } else {
          return 'Your logo will render as PNG in Apple Mail. VML is not supported in Apple Mail.';
        }
        
      case 'gmail':
        if (fallbackType === 'png') {
          return 'Your logo will render as PNG in Gmail, which is the recommended format as Gmail does not support SVG or VML.';
        } else {
          return 'Your logo will fall back to PNG in Gmail, as Gmail does not support SVG or VML formats.';
        }
        
      case 'outlook-desktop':
        if (fallbackType === 'vml') {
          return 'Your logo will render as VML in Outlook Desktop, providing vector quality while maintaining compatibility.';
        } else if (fallbackType === 'png') {
          return 'Your logo will render as PNG in Outlook Desktop. While Outlook supports VML, a PNG fallback is being used, which may appear pixelated at larger sizes.';
        } else {
          return 'Your logo will fall back to PNG in Outlook Desktop, as Outlook does not support SVG format.';
        }
        
      default:
        if (fallbackType === 'svg') {
          return `Your logo will render as SVG in ${clientId}, providing excellent quality at any size.`;
        } else if (fallbackType === 'png') {
          return `Your logo will render as PNG in ${clientId}, which may appear pixelated at larger sizes.`;
        } else {
          return `Your logo will render using ${fallbackType} in ${clientId}.`;
        }
    }
  }
}

export default PlatformDetailsService;