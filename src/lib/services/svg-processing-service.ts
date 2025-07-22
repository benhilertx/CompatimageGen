import { optimize, loadConfig, OptimizeOptions } from 'svgo';
import { Warning } from '../../types';
import { APP_CONFIG } from '../../config/app-config';

/**
 * Service for processing and optimizing SVG files
 */
export class SVGProcessingService {
  /**
   * Minify SVG content using SVGO
   * @param svgString Original SVG content as string
   * @param customOptions Optional custom SVGO options
   * @returns Optimized SVG content
   */
  static async minifySvg(svgString: string, customOptions?: OptimizeOptions): Promise<string> {
    try {
      // Default SVGO options if not provided
      const defaultOptions: OptimizeOptions = {
        multipass: true,
        plugins: [
          {
            name: 'preset-default'
          },
          {
            name: 'removeViewBox',
            active: false
          },
          'removeDimensions',
          {
            name: 'prefixIds',
            params: {
              prefix: () => `logo-${Math.random().toString(36).substring(2, 9)}`
            }
          }
        ]
      };
      
      const options = customOptions || defaultOptions;
      const result = optimize(svgString, options);
      return result.data;
    } catch (error) {
      console.error('SVG minification error:', error);
      throw new Error(`Failed to minify SVG: ${(error as Error).message}`);
    }
  }

  /**
   * Sanitize SVG to remove potentially dangerous elements
   * @param svgString SVG content as string
   * @returns Sanitized SVG content
   */
  static sanitizeSvg(svgString: string): string {
    try {
      // First manually remove script tags since SVGO might not handle them properly
      let sanitized = svgString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      // Use SVGO to sanitize further
      const sanitizeOptions: OptimizeOptions = {
        multipass: true,
        plugins: [
          {
            name: 'preset-default'
          },
          {
            name: 'removeViewBox',
            active: false
          },
          // Prefix IDs to avoid collisions
          {
            name: 'prefixIds',
            params: {
              prefix: () => `logo-${Math.random().toString(36).substring(2, 9)}`
            }
          },
          // Custom plugin to remove event handlers
          {
            name: 'customPluginRemoveEventHandlers',
            type: 'visitor',
            fn: () => {
              return {
                element: {
                  enter: (node: any) => {
                    if (node.attributes) {
                      Object.keys(node.attributes).forEach(attr => {
                        if (attr.startsWith('on')) {
                          delete node.attributes[attr];
                        }
                      });
                    }
                  }
                }
              };
            }
          }
        ]
      };

      const result = optimize(sanitized, sanitizeOptions);
      return result.data;
    } catch (error) {
      console.error('SVG sanitization error:', error);
      throw new Error(`Failed to sanitize SVG: ${(error as Error).message}`);
    }
  }

  /**
   * Analyze SVG complexity to detect features that may cause issues with VML conversion
   * @param svgString SVG content as string
   * @returns Array of warnings for complex features
   */
  static analyzeSvgComplexity(svgString: string): Warning[] {
    const warnings: Warning[] = [];
    
    try {
      // Check for animations
      if (svgString.includes('<animate') || 
          svgString.includes('animateTransform') || 
          svgString.includes('animateMotion')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains animations which are not supported in VML or most email clients',
          severity: 'high'
        });
      }
      
      // Check for gradients
      if (svgString.includes('<linearGradient') || 
          svgString.includes('<radialGradient')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains gradients which may not convert well to VML',
          severity: 'medium'
        });
      }
      
      // Check for filters
      if (svgString.includes('<filter') || 
          svgString.includes('filter=')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains filters which are not supported in VML',
          severity: 'high'
        });
      }
      
      // Check for masks
      if (svgString.includes('<mask') || 
          svgString.includes('mask=')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains masks which are not supported in VML',
          severity: 'high'
        });
      }
      
      // Check for complex paths
      const pathMatches = svgString.match(/<path[^>]*d="([^"]*)"[^>]*>/g) || [];
      for (const pathMatch of pathMatches) {
        const dAttr = pathMatch.match(/d="([^"]*)"/)?.[1] || '';
        
        // Count path commands as a rough complexity measure
        const commands = dAttr.match(/[MLHVCSQTAZ]/gi) || [];
        if (commands.length > 50) {
          warnings.push({
            type: 'svg-complexity',
            message: 'SVG contains complex paths which may not render correctly in VML',
            severity: 'medium'
          });
          break;
        }
      }
      
      // Check for embedded images
      if (svgString.includes('<image') || 
          svgString.includes('data:image/')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains embedded images which may not convert well to VML',
          severity: 'medium'
        });
      }
      
      // Check for text elements
      if (svgString.includes('<text') || 
          svgString.includes('<tspan')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains text elements which may not render correctly in VML',
          severity: 'medium'
        });
      }
      
      // Check for clip paths
      if (svgString.includes('<clipPath') || 
          svgString.includes('clip-path=')) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG contains clip paths which are not supported in VML',
          severity: 'high'
        });
      }
      
      // Check SVG size
      if (svgString.length > 20000) {
        warnings.push({
          type: 'svg-complexity',
          message: 'SVG is very large and may cause performance issues in email clients',
          severity: 'medium'
        });
      }
      
    } catch (error) {
      console.error('SVG complexity analysis error:', error);
      warnings.push({
        type: 'svg-complexity',
        message: 'Failed to analyze SVG complexity',
        severity: 'medium'
      });
    }
    
    return warnings;
  }

  /**
   * Process an SVG file with optimization, sanitization, and complexity analysis
   * @param svgString Original SVG content as string
   * @returns Object containing processed SVG and warnings
   */
  static async processSvg(svgString: string): Promise<{ 
    optimizedSvg: string; 
    warnings: Warning[];
  }> {
    try {
      // First sanitize the SVG to remove potentially dangerous elements
      const sanitizedSvg = this.sanitizeSvg(svgString);
      
      // Then analyze complexity to detect potential issues
      const warnings = this.analyzeSvgComplexity(sanitizedSvg);
      
      // Finally optimize the SVG
      const optimizedSvg = await this.minifySvg(sanitizedSvg);
      
      return {
        optimizedSvg,
        warnings
      };
    } catch (error) {
      console.error('SVG processing error:', error);
      return {
        optimizedSvg: svgString, // Return original if processing fails
        warnings: [{
          type: 'svg-complexity',
          message: `SVG processing failed: ${(error as Error).message}`,
          severity: 'high'
        }]
      };
    }
  }

  /**
   * Check if an SVG can be converted to VML
   * @param svgString SVG content as string
   * @returns Boolean indicating if conversion is likely to succeed
   */
  static canConvertToVml(svgString: string): boolean {
    const warnings = this.analyzeSvgComplexity(svgString);
    
    // Count high severity warnings that would prevent VML conversion
    const highSeverityWarnings = warnings.filter(w => w.severity === 'high');
    
    // If there are any high severity warnings, conversion is likely to fail
    return highSeverityWarnings.length === 0;
  }
}

export default SVGProcessingService;