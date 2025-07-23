import { describe, it, expect } from 'vitest';
import { PlatformDetailsService } from '../platform-details-service';
import { EmailClient } from '@/types';

describe('PlatformDetailsService', () => {
  describe('getPlatformDetails', () => {
    it('should return details for Apple Mail', () => {
      const details = PlatformDetailsService.getPlatformDetails('apple-mail');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Apple Mail');
      expect(details.supportedFeatures).toContain('SVG images');
      expect(details.limitations).toBeDefined();
      expect(details.bestPractices).toBeDefined();
      expect(details.renderingNotes).toBeDefined();
    });
    
    it('should return details for Gmail', () => {
      const details = PlatformDetailsService.getPlatformDetails('gmail');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Gmail');
      expect(details.supportedFeatures).not.toContain('SVG images');
      expect(details.limitations).toContain('No SVG support');
      expect(details.bestPractices).toBeDefined();
      expect(details.renderingNotes).toBeDefined();
    });
    
    it('should return details for Outlook Desktop', () => {
      const details = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Outlook Desktop');
      expect(details.supportedFeatures).toContain('VML for vector graphics');
      expect(details.limitations).toContain('No SVG support');
      expect(details.bestPractices).toBeDefined();
      expect(details.renderingNotes).toBeDefined();
    });
    
    it('should return fallback details for unknown clients', () => {
      // Using type assertion to test with an invalid client ID
      const details = PlatformDetailsService.getPlatformDetails('unknown' as EmailClient);
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Unknown Client');
      expect(details.supportedFeatures).toBeDefined();
      expect(details.limitations).toBeDefined();
      expect(details.bestPractices).toBeDefined();
      expect(details.renderingNotes).toBeDefined();
    });
  });
  
  describe('getPlatformRenderingNotes', () => {
    it('should return SVG rendering notes for Apple Mail', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('apple-mail', 'svg');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('SVG');
      expect(notes).toContain('Apple Mail');
    });
    
    it('should return PNG rendering notes for Gmail', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'png');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('PNG');
      expect(notes).toContain('Gmail');
    });
    
    it('should return VML rendering notes for Outlook Desktop', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('outlook-desktop', 'vml');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('VML');
      expect(notes).toContain('Outlook');
    });
    
    it('should handle fallback scenarios', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'svg');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('fall back to PNG');
      expect(notes).toContain('Gmail');
    });
  });
});