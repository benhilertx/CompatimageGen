import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HTMLTemplateService } from '../html-template-service';
import { FallbackData } from '@/types';
import APP_CONFIG from '@/config/app-config';

describe('HTMLTemplateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateEmailHtml', () => {
    it('should generate HTML with all fallbacks when all data is provided', () => {
      const fallbackData: FallbackData = {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>',
        pngBase64: 'base64-encoded-png-data',
        vmlCode: '<!--[if vml]><v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:100px;height:100px;" fillcolor="red"></v:oval><![endif]-->',
        dimensions: { width: 100, height: 100 },
        altText: 'Company Logo'
      };
      
      const result = HTMLTemplateService.generateEmailHtml(fallbackData);
      
      // Check that result contains all fallbacks
      expect(result).toContain('<!--[if vml]>'); // VML
      expect(result).toContain('<svg'); // SVG
      expect(result).toContain('base64-encoded-png-data'); // PNG
      
      // Check that result contains responsive wrapper
      expect(result).toContain('max-width: 100px');
      expect(result).toContain('padding-bottom: 100%'); // Aspect ratio
      
      // Check that result contains alt text
      expect(result).toContain('Company Logo');
      
      // Check that result contains comments if enabled
      if (APP_CONFIG.output.html.includeComments) {
        expect(result).toContain('<!-- CompatimageGen Email Logo - Begin -->');
        expect(result).toContain('<!-- CompatimageGen Email Logo - End -->');
      }
    });

    it('should generate HTML with only PNG fallback when SVG and VML are not provided', () => {
      const fallbackData: FallbackData = {
        pngBase64: 'base64-encoded-png-data',
        dimensions: { width: 100, height: 100 },
        altText: 'Company Logo'
      };
      
      const result = HTMLTemplateService.generateEmailHtml(fallbackData);
      
      // Check that result contains PNG fallback
      expect(result).toContain('base64-encoded-png-data');
      
      // Check that result does not contain SVG or VML
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('<!--[if vml]><v:');
      
      // Check that result still contains responsive wrapper
      expect(result).toContain('max-width: 100px');
    });

    it('should generate HTML with SVG and PNG fallbacks when VML is not provided', () => {
      const fallbackData: FallbackData = {
        svgContent: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>',
        pngBase64: 'base64-encoded-png-data',
        dimensions: { width: 100, height: 100 },
        altText: 'Company Logo'
      };
      
      const result = HTMLTemplateService.generateEmailHtml(fallbackData);
      
      // Check that result contains SVG and PNG fallbacks
      expect(result).toContain('<svg');
      expect(result).toContain('base64-encoded-png-data');
      
      // Check that result does not contain VML
      expect(result).not.toContain('<!--[if vml]><v:');
    });

    it('should generate HTML with VML and PNG fallbacks when SVG is not provided', () => {
      const fallbackData: FallbackData = {
        pngBase64: 'base64-encoded-png-data',
        vmlCode: '<!--[if vml]><v:oval xmlns:v="urn:schemas-microsoft-com:vml" style="width:100px;height:100px;" fillcolor="red"></v:oval><![endif]-->',
        dimensions: { width: 100, height: 100 },
        altText: 'Company Logo'
      };
      
      const result = HTMLTemplateService.generateEmailHtml(fallbackData);
      
      // Check that result contains VML and PNG fallbacks
      expect(result).toContain('<!--[if vml]>');
      expect(result).toContain('base64-encoded-png-data');
      
      // Check that result does not contain SVG
      expect(result).not.toContain('<svg');
    });
  });

  describe('createResponsiveWrapper', () => {
    it('should create a responsive wrapper with correct aspect ratio', () => {
      const content = '<div>Test content</div>';
      const width = 200;
      const height = 100;
      
      const result = HTMLTemplateService.createResponsiveWrapper(content, width, height);
      
      // Check that result contains responsive wrapper
      expect(result).toContain(`max-width: ${width}px`);
      expect(result).toContain(`padding-bottom: ${(height / width) * 100}%`);
      expect(result).toContain('position: relative');
      expect(result).toContain('position: absolute');
      
      // Check that result contains the content
      expect(result).toContain(content);
    });

    it('should handle square dimensions', () => {
      const content = '<div>Test content</div>';
      const width = 100;
      const height = 100;
      
      const result = HTMLTemplateService.createResponsiveWrapper(content, width, height);
      
      // For square, padding-bottom should be 100%
      expect(result).toContain('padding-bottom: 100%');
    });

    it('should handle portrait dimensions', () => {
      const content = '<div>Test content</div>';
      const width = 100;
      const height = 200;
      
      const result = HTMLTemplateService.createResponsiveWrapper(content, width, height);
      
      // For portrait, padding-bottom should be 200%
      expect(result).toContain('padding-bottom: 200%');
    });
  });

  describe('addAccessibilityAttributes', () => {
    it('should add title and aria attributes to SVG', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      const altText = 'Company Logo';
      
      const result = HTMLTemplateService.addAccessibilityAttributes(svg, altText);
      
      // Check that result contains title element
      expect(result).toContain(`<title>${altText}</title>`);
      
      // Check that result contains aria attributes
      expect(result).toContain(`role="img"`);
      expect(result).toContain(`aria-label="${altText}"`);
    });

    it('should not add title if SVG already has one', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Existing Title</title><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      const altText = 'Company Logo';
      
      const result = HTMLTemplateService.addAccessibilityAttributes(svg, altText);
      
      // Check that result does not contain a new title element
      expect(result).not.toContain(`<title>${altText}</title>`);
      
      // Check that result still contains aria attributes
      expect(result).toContain(`role="img"`);
      expect(result).toContain(`aria-label="${altText}"`);
    });

    it('should escape HTML in alt text', () => {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>';
      const altText = 'Company & Logo <script>alert("XSS")</script>';
      
      const result = HTMLTemplateService.addAccessibilityAttributes(svg, altText);
      
      // Check that HTML is escaped in title and aria-label
      expect(result).toContain(`<title>Company &amp; Logo &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</title>`);
      expect(result).toContain(`aria-label="Company &amp; Logo &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"`);
    });

    it('should not modify non-SVG HTML', () => {
      const html = '<div>Not an SVG</div>';
      const altText = 'Company Logo';
      
      const result = HTMLTemplateService.addAccessibilityAttributes(html, altText);
      
      // Check that result is unchanged
      expect(result).toBe(html);
    });
  });

  describe('validateHtml', () => {
    it('should validate HTML without issues', () => {
      const html = '<div><img src="data:image/png;base64,abc123" alt="Logo" /></div>';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is valid
      expect(valid).toBe(true);
      expect(warnings.length).toBe(0);
    });

    it('should detect external URLs', () => {
      const html = '<div><img src="https://example.com/logo.png" alt="Logo" /></div>';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is invalid due to external URL
      expect(valid).toBe(false);
      expect(warnings.some(w => w.includes('external URLs'))).toBe(true);
    });

    it('should detect script tags', () => {
      const html = '<div><script>alert("XSS")</script></div>';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is invalid due to script tag
      expect(valid).toBe(false);
      expect(warnings.some(w => w.includes('script tags'))).toBe(true);
    });

    it('should detect unsupported CSS', () => {
      const html = '<style>@media screen { body { color: red; } }</style>';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is invalid due to media query
      expect(valid).toBe(false);
      expect(warnings.some(w => w.includes('CSS media queries'))).toBe(true);
    });

    it('should detect HTML5 elements', () => {
      const html = '<article>Content</article>';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is invalid due to HTML5 element
      expect(valid).toBe(false);
      expect(warnings.some(w => w.includes('article element'))).toBe(true);
    });

    it('should detect multiple issues', () => {
      const html = '<article>Content</article><script>alert("XSS")</script><img src="https://example.com/logo.png" alt="Logo" />';
      
      const { valid, warnings } = HTMLTemplateService.validateHtml(html);
      
      // Check that HTML is invalid with multiple warnings
      expect(valid).toBe(false);
      expect(warnings.length).toBe(3);
    });
  });
});