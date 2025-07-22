import { describe, it, expect } from 'vitest';
import { HTMLTemplateService } from '../html-template-service';
import { FallbackData } from '../../../types';

describe('HTMLTemplateService', () => {
  // Sample test data
  const sampleFallbackData: FallbackData = {
    svgContent: '<svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>',
    pngBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    vmlCode: '<!--[if vml]><v:oval style="width:100px;height:100px" fillcolor="blue" /></v:oval><![endif]-->',
    dimensions: { width: 100, height: 100 },
    altText: 'Company Logo'
  };

  describe('generateEmailHtml', () => {
    it('should generate HTML with all fallbacks', () => {
      const html = HTMLTemplateService.generateEmailHtml(sampleFallbackData);
      
      // Check for all required elements
      expect(html).toContain('<!-- CompatimageGen Email Logo - Begin -->');
      expect(html).toContain('<!-- CompatimageGen Email Logo - End -->');
      expect(html).toContain('<!--[if vml]>');
      expect(html).toContain('<!--[if !mso]><!-->');
      expect(html).toContain('<!--[if !vml]><!-->');
      expect(html).toContain('<img src="data:image/png;base64,');
      expect(html).toContain('alt="Company Logo"');
      expect(html).toContain('aria-label="Company Logo"');
    });

    it('should handle missing SVG content', () => {
      const dataWithoutSvg = { ...sampleFallbackData, svgContent: undefined };
      const html = HTMLTemplateService.generateEmailHtml(dataWithoutSvg);
      
      // Should not contain SVG wrapper
      expect(html).not.toContain('<svg');
      // But should still have VML and PNG fallbacks
      expect(html).toContain('<!--[if vml]>');
      expect(html).toContain('<img src="data:image/png;base64,');
    });

    it('should handle missing VML code', () => {
      const dataWithoutVml = { ...sampleFallbackData, vmlCode: undefined };
      const html = HTMLTemplateService.generateEmailHtml(dataWithoutVml);
      
      // Should not contain VML wrapper
      expect(html).not.toContain('<!--[if vml]>');
      // But should still have SVG and PNG fallbacks
      expect(html).toContain('<svg');
      expect(html).toContain('<img src="data:image/png;base64,');
    });
  });

  describe('createResponsiveWrapper', () => {
    it('should create a responsive wrapper with correct aspect ratio', () => {
      const content = '<div>Test content</div>';
      const html = HTMLTemplateService.createResponsiveWrapper(content, 200, 100);
      
      // Check for responsive wrapper elements
      expect(html).toContain('max-width: 200px');
      expect(html).toContain('padding-bottom: 50%'); // 100/200 * 100
      expect(html).toContain('position: relative');
      expect(html).toContain('position: absolute');
      expect(html).toContain('<div>Test content</div>');
    });
  });

  describe('addAccessibilityAttributes', () => {
    it('should add accessibility attributes to SVG', () => {
      const svg = '<svg width="100" height="100"></svg>';
      const result = HTMLTemplateService.addAccessibilityAttributes(svg, 'Test Alt Text');
      
      // Check for added accessibility attributes
      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Test Alt Text"');
      expect(result).toContain('<title>Test Alt Text</title>');
    });

    it('should not add duplicate title if one already exists', () => {
      const svg = '<svg width="100" height="100"><title>Existing Title</title></svg>';
      const result = HTMLTemplateService.addAccessibilityAttributes(svg, 'Test Alt Text');
      
      // Should not add another title element
      expect(result.match(/<title>/g)?.length).toBe(1);
      // But should still add aria attributes
      expect(result).toContain('role="img"');
      expect(result).toContain('aria-label="Test Alt Text"');
    });
  });

  describe('validateHtml', () => {
    it('should detect external resources', () => {
      const html = '<img src="https://example.com/image.png">';
      const result = HTMLTemplateService.validateHtml(html);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('HTML contains external URLs which may not work in all email clients');
    });

    it('should detect script tags', () => {
      const html = '<script>alert("test");</script>';
      const result = HTMLTemplateService.validateHtml(html);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('HTML contains script tags which will be stripped by email clients');
    });

    it('should detect unsupported CSS', () => {
      const html = '<style>@media screen { body { color: red; } }</style>';
      const result = HTMLTemplateService.validateHtml(html);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('HTML contains CSS media queries or imports which have limited support in email clients');
    });

    it('should detect HTML5 elements', () => {
      const html = '<article>Test</article>';
      const result = HTMLTemplateService.validateHtml(html);
      
      expect(result.valid).toBe(false);
      expect(result.warnings).toContain('HTML contains article element which may not be supported in all email clients');
    });

    it('should validate clean HTML', () => {
      const html = '<table><tr><td>Simple email HTML</td></tr></table>';
      const result = HTMLTemplateService.validateHtml(html);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });
});