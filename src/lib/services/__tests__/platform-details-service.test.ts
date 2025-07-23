import { describe, it, expect } from 'vitest';
import { PlatformDetailsService } from '../platform-details-service';
import { EmailClient, EMAIL_CLIENTS } from '@/types';

describe('PlatformDetailsService', () => {
  describe('getPlatformDetails', () => {
    it('should return platform details for Apple Mail', () => {
      const details = PlatformDetailsService.getPlatformDetails('apple-mail');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Apple Mail');
      expect(details.marketShare).toBe(55);
      expect(details.supportedFeatures).toContain('SVG images');
      expect(details.limitations).toBeDefined();
      expect(details.bestPractices).toContain('Use SVG for vector graphics');
      expect(details.renderingNotes).toContain('Apple Mail offers excellent rendering capabilities');
    });
    
    it('should return platform details for Gmail', () => {
      const details = PlatformDetailsService.getPlatformDetails('gmail');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Gmail');
      expect(details.marketShare).toBe(29);
      expect(details.supportedFeatures).not.toContain('SVG images');
      expect(details.limitations).toContain('No support for SVG images');
      expect(details.bestPractices).toContain('Use inline CSS for styling');
      expect(details.renderingNotes).toContain('Gmail strips out');
    });
    
    it('should return platform details for Outlook Desktop', () => {
      const details = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      
      expect(details).toBeDefined();
      expect(details.name).toBe('Outlook Desktop');
      expect(details.marketShare).toBe(6);
      expect(details.supportedFeatures).toContain('VML graphics');
      expect(details.limitations).toContain('No support for SVG images');
      expect(details.bestPractices).toContain('Use VML for vector graphics');
      expect(details.renderingNotes).toContain('Outlook Desktop uses Microsoft Word');
    });
    
    it('should return default details for unknown clients', () => {
      const unknownClient = 'unknown-client' as EmailClient;
      const details = PlatformDetailsService.getPlatformDetails(unknownClient);
      
      expect(details).toBeDefined();
      expect(details.name).toBe(unknownClient);
      expect(details.marketShare).toBe(0);
      expect(details.supportedFeatures).toHaveLength(0);
      expect(details.limitations).toContain('Unknown client capabilities');
      expect(details.bestPractices).toContain('Use PNG fallback for maximum compatibility');
      expect(details.renderingNotes).toContain('No specific rendering information available');
    });
    
    it('should include all required fields in platform details', () => {
      // Test for all defined email clients
      for (const client of EMAIL_CLIENTS) {
        const details = PlatformDetailsService.getPlatformDetails(client.id);
        
        expect(details).toBeDefined();
        expect(details.name).toBe(client.name);
        expect(details.marketShare).toBe(client.marketShare);
        expect(Array.isArray(details.supportedFeatures)).toBe(true);
        expect(Array.isArray(details.limitations)).toBe(true);
        expect(Array.isArray(details.bestPractices)).toBe(true);
        expect(typeof details.renderingNotes).toBe('string');
      }
    });
  });
  
  describe('getPlatformRenderingNotes', () => {
    it('should return SVG rendering notes for clients that support SVG', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('apple-mail', 'svg');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('Apple Mail has excellent SVG support');
      expect(notes).toContain('vector graphic');
    });
    
    it('should return PNG rendering notes for clients that use PNG fallback', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'png');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('Gmail has good support for PNG images');
      expect(notes).toContain('raster image');
    });
    
    it('should return VML rendering notes for clients that support VML', () => {
      const notes = PlatformDetailsService.getPlatformRenderingNotes('outlook-desktop', 'vml');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('Outlook Desktop has good support for VML graphics');
      expect(notes).toContain('Vector Markup Language');
    });
    
    it('should return fallback message for unsupported combinations', () => {
      // Gmail doesn't support SVG
      const notes = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'svg');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('does not support SVG images');
      expect(notes).toContain('PNG fallback will be used');
    });
    
    it('should return default message for unknown clients', () => {
      const unknownClient = 'unknown-client' as EmailClient;
      const notes = PlatformDetailsService.getPlatformRenderingNotes(unknownClient, 'png');
      
      expect(notes).toBeDefined();
      expect(notes).toContain('No specific rendering information available');
    });
  });
});