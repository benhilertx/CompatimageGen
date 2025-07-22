import { describe, it, expect, vi } from 'vitest';
import { SVGProcessingService } from '../svg-processing-service';
import { Warning } from '../../../types';

describe('SVGProcessingService', () => {
  // Sample SVG strings for testing
  const simpleSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
  const complexSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#grad1)" filter="url(#blur)" />
      <animate attributeName="r" begin="0s" dur="1s" repeatCount="indefinite" from="40" to="45" />
    </svg>
  `;
  const maliciousSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <script>alert('XSS');</script>
      <circle cx="50" cy="50" r="40" fill="red" onclick="alert('clicked')" />
    </svg>
  `;

  describe('minifySvg', () => {
    it('should minify SVG content', async () => {
      const result = await SVGProcessingService.minifySvg(simpleSvg);
      
      // Minified SVG should be smaller than original
      expect(result.length).toBeLessThan(simpleSvg.length);
      
      // Should still contain essential SVG elements
      expect(result).toContain('<svg');
      expect(result).toContain('<circle');
      expect(result).toContain('</svg>');
    });

    it('should handle errors during minification', async () => {
      // Mock optimize to throw an error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const invalidSvg = '<svg>Invalid</svg';
      await expect(SVGProcessingService.minifySvg(invalidSvg)).rejects.toThrow();
      
      vi.restoreAllMocks();
    });
  });

  describe('sanitizeSvg', () => {
    it('should remove script elements', () => {
      const result = SVGProcessingService.sanitizeSvg(maliciousSvg);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(');
    });

    it('should remove event handlers', () => {
      const result = SVGProcessingService.sanitizeSvg(maliciousSvg);
      
      expect(result).not.toContain('onclick=');
    });
  });

  describe('analyzeSvgComplexity', () => {
    it('should detect animations', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(complexSvg);
      
      const animationWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('animations')
      );
      
      expect(animationWarning).toBeDefined();
      expect(animationWarning?.severity).toBe('high');
    });

    it('should detect gradients', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(complexSvg);
      
      const gradientWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('gradients')
      );
      
      expect(gradientWarning).toBeDefined();
      expect(gradientWarning?.severity).toBe('medium');
    });

    it('should detect filters', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(complexSvg);
      
      const filterWarning = warnings.find(w => 
        w.type === 'svg-complexity' && 
        w.message.includes('filters')
      );
      
      expect(filterWarning).toBeDefined();
      expect(filterWarning?.severity).toBe('high');
    });

    it('should not report issues with simple SVGs', () => {
      const warnings = SVGProcessingService.analyzeSvgComplexity(simpleSvg);
      expect(warnings.length).toBe(0);
    });
  });

  describe('processSvg', () => {
    it('should process SVG with optimization, sanitization, and complexity analysis', async () => {
      const result = await SVGProcessingService.processSvg(complexSvg);
      
      expect(result.optimizedSvg).toBeDefined();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle errors during processing', async () => {
      vi.spyOn(SVGProcessingService, 'sanitizeSvg').mockImplementation(() => {
        throw new Error('Sanitization failed');
      });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await SVGProcessingService.processSvg(simpleSvg);
      
      expect(result.optimizedSvg).toBe(simpleSvg); // Should return original on error
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].severity).toBe('high');
      
      vi.restoreAllMocks();
    });
  });

  describe('canConvertToVml', () => {
    it('should return true for simple SVGs', () => {
      const result = SVGProcessingService.canConvertToVml(simpleSvg);
      expect(result).toBe(true);
    });

    it('should return false for complex SVGs with high severity warnings', () => {
      const result = SVGProcessingService.canConvertToVml(complexSvg);
      expect(result).toBe(false);
    });
  });
});