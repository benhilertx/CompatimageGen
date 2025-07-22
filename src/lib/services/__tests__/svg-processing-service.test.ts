import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SVGProcessingService } from '../svg-processing-service';
import { Warning } from '@/types';
import { testSvgs } from '@/lib/test-utils/test-setup';
import { optimize } from 'svgo';

// Mock SVGO
vi.mock('svgo', () => ({
  optimize: vi.fn().mockImplementation((svg) => ({
    data: svg.replace(/\s+/g, ' ').trim()
  }))
}));

describe('SVGProcessingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('minifySvg', () => {
    it('should minify SVG content', async () => {
      const result = await SVGProcessingService.minifySvg(testSvgs.simple);
      
      // Minified SVG should be smaller than original
      expect(result.length).toBeLessThan(testSvgs.simple.length);
      
      // Should still contain essential SVG elements
      expect(result).toContain('<svg');
      expect(result).toContain('<circle');
      expect(result).toContain('</svg>');
      
      // Verify SVGO was called
      expect(optimize).toHaveBeenCalledWith(testSvgs.simple, expect.any(Object));
    });

    it('should handle errors during minification', async () => {
      // Mock optimize to throw an error
      (optimize as any).mockImplementationOnce(() => {
        throw new Error('SVGO error');
      });
      
      await expect(SVGProcessingService.minifySvg(testSvgs.invalid)).rejects.toThrow('Failed to minify SVG');
    });
    
    it('should use custom options when provided', async () => {
      const customOptions = {
        plugins: ['cleanupAttrs']
      };
      
      await SVGProcessingService.minifySvg(testSvgs.simple, customOptions);
      
      // Verify SVGO was called with custom options
      expect(optimize).toHaveBeenCalledWith(testSvgs.simple, customOptions);
    });
  });

  describe('sanitizeSvg', () => {
    it('should remove script elements', () => {
      const result = SVGProcessingService.sanitizeSvg(testSvgs.malicious);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(');
    });

    it('should remove event handlers', () => {
      const result = SVGProcessingService.sanitizeSvg(testSvgs.malicious);
      
      expect(result).not.toContain('onclick=');
    });
    
    it('should handle errors during sanitization', () => {
      // Mock optimize to throw an error for sanitization
      (optimize as any).mockImplementationOnce(() => {
        throw new Error('SVGO error');
      });
      
      expect(() => SVGProcessingService.sanitizeSvg(testSvgs.invalid)).toThrow('Failed to sanitize SVG');
    });
  });

  describe('analyzeSvgComplexity', () => {
    it('should detect animations', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(testSvgs.complex);
      
      const animationWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('animations')
      );
      
      expect(animationWarning).toBeDefined();
      expect(animationWarning?.severity).toBe('high');
    });

    it('should detect gradients', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(testSvgs.complex);
      
      const gradientWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('gradients')
      );
      
      expect(gradientWarning).toBeDefined();
      expect(gradientWarning?.severity).toBe('medium');
    });

    it('should detect filters', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(testSvgs.complex);
      
      const filterWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('filters')
      );
      
      expect(filterWarning).toBeDefined();
      expect(filterWarning?.severity).toBe('high');
    });

    it('should not report issues with simple SVGs', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(testSvgs.simple);
      expect(warnings.length).toBe(0);
    });
    
    it('should detect masks', () => {
      const svgWithMask = '<svg xmlns="http://www.w3.org/2000/svg"><mask id="m"><rect width="100" height="100" fill="white"/></mask><rect mask="url(#m)" width="100" height="100"/></svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(svgWithMask);
      
      const maskWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('masks')
      );
      
      expect(maskWarning).toBeDefined();
      expect(maskWarning?.severity).toBe('high');
    });
    
    it('should detect complex paths', () => {
      // Create an SVG with a complex path (more than 50 commands)
      let complexPath = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0,0';
      for (let i = 0; i < 60; i++) {
        complexPath += ` L${i},${i}`;
      }
      complexPath += '"/></svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(complexPath);
      
      const pathWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('complex paths')
      );
      
      expect(pathWarning).toBeDefined();
      expect(pathWarning?.severity).toBe('medium');
    });
    
    it('should detect embedded images', () => {
      const svgWithImage = '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,abc123" width="100" height="100"/></svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(svgWithImage);
      
      const imageWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('embedded images')
      );
      
      expect(imageWarning).toBeDefined();
      expect(imageWarning?.severity).toBe('medium');
    });
    
    it('should detect text elements', () => {
      const svgWithText = '<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="10">Hello</text></svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(svgWithText);
      
      const textWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('text elements')
      );
      
      expect(textWarning).toBeDefined();
      expect(textWarning?.severity).toBe('medium');
    });
    
    it('should detect clip paths', () => {
      const svgWithClipPath = '<svg xmlns="http://www.w3.org/2000/svg"><clipPath id="cp"><circle cx="50" cy="50" r="40"/></clipPath><rect clip-path="url(#cp)" width="100" height="100"/></svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(svgWithClipPath);
      
      const clipPathWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('clip paths')
      );
      
      expect(clipPathWarning).toBeDefined();
      expect(clipPathWarning?.severity).toBe('high');
    });
    
    it('should warn about large SVGs', () => {
      // Create a large SVG string
      let largeSvg = '<svg xmlns="http://www.w3.org/2000/svg">';
      for (let i = 0; i < 1000; i++) {
        largeSvg += `<rect x="${i}" y="${i}" width="10" height="10" />`;
      }
      largeSvg += '</svg>';
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(largeSvg);
      
      const sizeWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('very large')
      );
      
      expect(sizeWarning).toBeDefined();
      expect(sizeWarning?.severity).toBe('medium');
    });
    
    it('should handle errors during analysis', () => {
      // Mock a function that will be called during analysis to throw an error
      const originalIncludes = String.prototype.includes;
      String.prototype.includes = function() {
        throw new Error('Test error');
      };
      
      const warnings = SVGProcessingService.analyzeSvgComplexity(testSvgs.simple);
      
      // Restore the original function
      String.prototype.includes = originalIncludes;
      
      const errorWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('Failed to analyze')
      );
      
      expect(errorWarning).toBeDefined();
      expect(errorWarning?.severity).toBe('medium');
    });
  });

  describe('processSvg', () => {
    it('should process SVG with optimization, sanitization, and complexity analysis', async () => {
      // Spy on the component methods
      const sanitizeSpy = vi.spyOn(SVGProcessingService, 'sanitizeSvg');
      const analyzeSpy = vi.spyOn(SVGProcessingService, 'analyzeSvgComplexity');
      const minifySpy = vi.spyOn(SVGProcessingService, 'minifySvg');
      
      const result = await SVGProcessingService.processSvg(testSvgs.complex);
      
      expect(result.optimizedSvg).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
      
      // Verify all methods were called
      expect(sanitizeSpy).toHaveBeenCalledWith(testSvgs.complex);
      expect(analyzeSpy).toHaveBeenCalled();
      expect(minifySpy).toHaveBeenCalled();
    });

    it('should handle errors during processing', async () => {
      // Mock sanitizeSvg to throw an error
      vi.spyOn(SVGProcessingService, 'sanitizeSvg').mockImplementationOnce(() => {
        throw new Error('Sanitization failed');
      });
      
      const result = await SVGProcessingService.processSvg(testSvgs.simple);
      
      expect(result.optimizedSvg).toBe(testSvgs.simple); // Should return original on error
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].severity).toBe('high');
      expect(result.warnings[0].message).toContain('SVG processing failed');
    });
  });

  describe('canConvertToVml', () => {
    it('should return true for simple SVGs', () => {
      const result = SVGProcessingService.canConvertToVml(testSvgs.simple);
      expect(result).toBe(true);
    });

    it('should return false for complex SVGs with high severity warnings', () => {
      const result = SVGProcessingService.canConvertToVml(testSvgs.complex);
      expect(result).toBe(false);
    });
    
    it('should return true for SVGs with only medium severity warnings', () => {
      // Create an SVG with only medium severity issues (like text elements)
      const svgWithText = '<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="10">Hello</text></svg>';
      
      const result = SVGProcessingService.canConvertToVml(svgWithText);
      expect(result).toBe(true);
    });
  });
});