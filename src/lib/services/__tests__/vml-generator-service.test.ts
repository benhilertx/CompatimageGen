import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VMLGeneratorService } from '../vml-generator-service';
import { SVGProcessingService } from '../svg-processing-service';
import { testSvgs } from '@/lib/test-utils/test-setup';

// Mock SVGProcessingService
vi.mock('../svg-processing-service', () => ({
  SVGProcessingService: {
    canConvertToVml: vi.fn().mockReturnValue(true)
  }
}));

// Mock DOMParser for SVG parsing
global.DOMParser = class {
  parseFromString(svgString: string) {
    // Create a simple mock of the parsed SVG document
    const mockSvgElement = {
      documentElement: {
        nodeName: 'svg',
        nodeType: 1,
        getAttribute: (attr: string) => {
          if (attr === 'viewBox') return '0 0 100 100';
          if (attr === 'width') return '100';
          if (attr === 'height') return '100';
          return null;
        },
        attributes: [
          { name: 'xmlns', value: 'http://www.w3.org/2000/svg' },
          { name: 'viewBox', value: '0 0 100 100' },
          { name: 'width', value: '100' },
          { name: 'height', value: '100' }
        ],
        childNodes: [
          {
            nodeName: 'circle',
            nodeType: 1,
            attributes: [
              { name: 'cx', value: '50' },
              { name: 'cy', value: '50' },
              { name: 'r', value: '40' },
              { name: 'fill', value: 'red' }
            ],
            childNodes: [],
            getAttribute: (attr: string) => {
              if (attr === 'cx') return '50';
              if (attr === 'cy') return '50';
              if (attr === 'r') return '40';
              if (attr === 'fill') return 'red';
              return null;
            }
          }
        ]
      }
    };
    return mockSvgElement;
  }
};

describe('VMLGeneratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('convertSvgToVml', () => {
    it('should convert simple SVG to VML', async () => {
      const { vmlCode, warnings } = await VMLGeneratorService.convertSvgToVml(testSvgs.simple);
      
      // Check that VML code was generated
      expect(vmlCode).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      expect(vmlCode).toContain('<!--[if vml]>');
      expect(vmlCode).toContain('<![endif]-->');
      
      // No warnings should be generated for simple SVG
      expect(warnings.length).toBe(0);
    });

    it('should generate warnings for complex SVGs', async () => {
      // Mock canConvertToVml to return false for complex SVG
      (SVGProcessingService.canConvertToVml as any).mockReturnValueOnce(false);
      
      const { vmlCode, warnings } = await VMLGeneratorService.convertSvgToVml(testSvgs.complex);
      
      // Should still generate VML code (placeholder)
      expect(vmlCode).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      
      // Should have warnings
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].type).toBe('vml-conversion');
      expect(warnings[0].severity).toBe('high');
    });
    
    it('should use provided dimensions', async () => {
      const width = 200;
      const height = 150;
      
      const { vmlCode } = await VMLGeneratorService.convertSvgToVml(testSvgs.simple, width, height);
      
      // VML code should contain the provided dimensions
      expect(vmlCode).toContain(`width:${width}px`);
      expect(vmlCode).toContain(`height:${height}px`);
    });
    
    it('should handle errors during conversion', async () => {
      // Mock parseSvg to throw an error
      vi.spyOn(VMLGeneratorService as any, 'parseSvg').mockImplementationOnce(() => {
        throw new Error('Parsing failed');
      });
      
      const { vmlCode, warnings } = await VMLGeneratorService.convertSvgToVml(testSvgs.simple);
      
      // Should generate placeholder VML
      expect(vmlCode).toContain('xmlns:v="urn:schemas-microsoft-com:vml"');
      
      // Should have error warning
      expect(warnings.length).toBe(1);
      expect(warnings[0].type).toBe('vml-conversion');
      expect(warnings[0].message).toContain('Failed to convert SVG to VML');
    });
  });

  describe('validateVml', () => {
    it('should validate correct VML code', () => {
      const vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:100px;height:100px;"></v:rect><![endif]-->';
      
      const { valid, warnings } = VMLGeneratorService.validateVml(vmlCode);
      
      expect(valid).toBe(true);
      expect(warnings.length).toBe(0);
    });

    it('should detect missing namespace declarations', () => {
      const vmlCode = '<!--[if vml]><v:rect style="width:100px;height:100px;"></v:rect><![endif]-->';
      
      const { valid, warnings } = VMLGeneratorService.validateVml(vmlCode);
      
      expect(valid).toBe(false);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0].message).toContain('missing required namespace');
    });

    it('should detect missing conditional comments', () => {
      const vmlCode = '<v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:100px;height:100px;"></v:rect>';
      
      const { valid, warnings } = VMLGeneratorService.validateVml(vmlCode);
      
      expect(valid).toBe(false);
      expect(warnings.some(w => w.message.includes('conditional comments'))).toBe(true);
    });

    it('should detect missing VML elements', () => {
      const vmlCode = '<!--[if vml]><div xmlns:v="urn:schemas-microsoft-com:vml">No VML here</div><![endif]-->';
      
      const { valid, warnings } = VMLGeneratorService.validateVml(vmlCode);
      
      expect(valid).toBe(false);
      expect(warnings.some(w => w.message.includes('does not contain any standard VML elements'))).toBe(true);
    });

    it('should warn about large VML code', () => {
      // Create a large VML string
      let largeVml = '<!--[if vml]><v:group xmlns:v="urn:schemas-microsoft-com:vml">';
      for (let i = 0; i < 500; i++) {
        largeVml += `<v:rect style="width:10px;height:10px;left:${i}px;top:${i}px;"></v:rect>`;
      }
      largeVml += '</v:group><![endif]-->';
      
      const { valid, warnings } = VMLGeneratorService.validateVml(largeVml);
      
      // Should be valid but with warnings
      expect(valid).toBe(true);
      expect(warnings.some(w => w.message.includes('very large'))).toBe(true);
    });
  });

  describe('addOutlookStyling', () => {
    it('should add Outlook-specific styling', () => {
      const vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml"></v:rect><![endif]-->';
      
      const styledVml = VMLGeneratorService.addOutlookStyling(vmlCode);
      
      // Should contain Outlook-specific styles
      expect(styledVml).toContain('behavior:url(#default#VML)');
      expect(styledVml).toContain('<!--[if gte mso 9]>');
      expect(styledVml).toContain('<style type="text/css">');
    });

    it('should add missing namespace declarations', () => {
      const vmlCode = '<!--[if vml]><v:group xmlns:v="urn:schemas-microsoft-com:vml"></v:group><![endif]-->';
      
      const styledVml = VMLGeneratorService.addOutlookStyling(vmlCode);
      
      // Should add office namespace if missing
      expect(styledVml).toContain('xmlns:o="urn:schemas-microsoft-com:office:office"');
    });
    
    it('should not duplicate existing namespace declarations', () => {
      const vmlCode = '<!--[if vml]><v:group xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"></v:group><![endif]-->';
      
      const styledVml = VMLGeneratorService.addOutlookStyling(vmlCode);
      
      // Count occurrences of the namespace declaration
      const count = (styledVml.match(/xmlns:o="urn:schemas-microsoft-com:office:office"/g) || []).length;
      
      // Should not duplicate the namespace
      expect(count).toBe(1);
    });
  });
  
  // Test private methods through public methods
  describe('private methods through public interface', () => {
    it('should handle different SVG elements', async () => {
      // Create a mock DOMParser that returns different SVG elements
      const originalDOMParser = global.DOMParser;
      
      // Test with rect element
      global.DOMParser = class {
        parseFromString() {
          return {
            documentElement: {
              nodeName: 'svg',
              nodeType: 1,
              getAttribute: () => null,
              attributes: [],
              childNodes: [{
                nodeName: 'rect',
                nodeType: 1,
                attributes: [
                  { name: 'x', value: '10' },
                  { name: 'y', value: '20' },
                  { name: 'width', value: '30' },
                  { name: 'height', value: '40' },
                  { name: 'fill', value: 'blue' }
                ],
                childNodes: [],
                getAttribute: (attr: string) => {
                  if (attr === 'x') return '10';
                  if (attr === 'y') return '20';
                  if (attr === 'width') return '30';
                  if (attr === 'height') return '40';
                  if (attr === 'fill') return 'blue';
                  return null;
                }
              }]
            }
          };
        }
      };
      
      const { vmlCode: rectVml } = await VMLGeneratorService.convertSvgToVml('<svg><rect x="10" y="20" width="30" height="40" fill="blue"/></svg>');
      expect(rectVml).toContain('<v:rect');
      
      // Restore original DOMParser
      global.DOMParser = originalDOMParser;
    });
  });
});