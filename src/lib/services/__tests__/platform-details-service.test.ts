import { describe, it, expect, vi } from 'vitest';
import { PlatformDetailsService } from '../platform-details-service';
import { EmailClient, EMAIL_CLIENTS, FallbackType } from '@/types';

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
    
    it('should include client-specific supported features', () => {
      const appleMail = PlatformDetailsService.getPlatformDetails('apple-mail');
      const gmail = PlatformDetailsService.getPlatformDetails('gmail');
      const outlookDesktop = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      
      // Apple Mail should have SVG support
      expect(appleMail.supportedFeatures).toContain('SVG images');
      expect(appleMail.supportedFeatures).toContain('CSS3 properties');
      expect(appleMail.supportedFeatures).toContain('Media queries');
      
      // Gmail should have responsive design but with limitations
      expect(gmail.supportedFeatures).toContain('Responsive design (with limitations)');
      expect(gmail.supportedFeatures).toContain('Limited CSS properties');
      
      // Outlook Desktop should have VML support
      expect(outlookDesktop.supportedFeatures).toContain('VML graphics');
      expect(outlookDesktop.supportedFeatures).toContain('Microsoft Office styles');
    });
    
    it('should include client-specific limitations', () => {
      const appleMail = PlatformDetailsService.getPlatformDetails('apple-mail');
      const gmail = PlatformDetailsService.getPlatformDetails('gmail');
      const outlookDesktop = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      
      // Apple Mail has few limitations
      expect(appleMail.limitations).toContain('Limited support for CSS filters');
      
      // Gmail has several limitations
      expect(gmail.limitations).toContain('No support for SVG images');
      expect(gmail.limitations).toContain('Strips <style> tags in <head>');
      expect(gmail.limitations).toContain('Limited CSS positioning');
      
      // Outlook Desktop has many limitations
      expect(outlookDesktop.limitations).toContain('No support for SVG images');
      expect(outlookDesktop.limitations).toContain('Limited CSS support (uses Word rendering engine)');
      expect(outlookDesktop.limitations).toContain('No border-radius');
    });
    
    it('should include client-specific best practices', () => {
      const appleMail = PlatformDetailsService.getPlatformDetails('apple-mail');
      const gmail = PlatformDetailsService.getPlatformDetails('gmail');
      const outlookDesktop = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      
      // Apple Mail best practices
      expect(appleMail.bestPractices).toContain('Use SVG for vector graphics');
      expect(appleMail.bestPractices).toContain('Take advantage of modern CSS features');
      
      // Gmail best practices
      expect(gmail.bestPractices).toContain('Use inline CSS for styling');
      expect(gmail.bestPractices).toContain('Keep table-based layouts simple');
      expect(gmail.bestPractices).toContain('Provide PNG fallback images');
      
      // Outlook Desktop best practices
      expect(outlookDesktop.bestPractices).toContain('Use VML for vector graphics');
      expect(outlookDesktop.bestPractices).toContain('Use table-based layouts');
      expect(outlookDesktop.bestPractices).toContain('Use conditional comments for Outlook-specific code');
    });
    
    it('should handle all email clients defined in EMAIL_CLIENTS', () => {
      // Test that all clients in EMAIL_CLIENTS can be processed
      for (const client of EMAIL_CLIENTS) {
        const details = PlatformDetailsService.getPlatformDetails(client.id);
        expect(details).toBeDefined();
        expect(details.name).toBe(client.name);
      }
    });
    
    it('should provide consistent data structure for all clients', () => {
      // Test all clients have the same data structure
      const clients: EmailClient[] = ['apple-mail', 'gmail', 'outlook-desktop', 'outlook-web', 'yahoo', 'thunderbird', 'samsung-mail'];
      
      for (const client of clients) {
        const details = PlatformDetailsService.getPlatformDetails(client);
        
        expect(details).toHaveProperty('name');
        expect(details).toHaveProperty('marketShare');
        expect(details).toHaveProperty('supportedFeatures');
        expect(details).toHaveProperty('limitations');
        expect(details).toHaveProperty('bestPractices');
        expect(details).toHaveProperty('renderingNotes');
        
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
    
    it('should provide client-specific SVG rendering notes', () => {
      const appleMail = PlatformDetailsService.getPlatformRenderingNotes('apple-mail', 'svg');
      const thunderbird = PlatformDetailsService.getPlatformRenderingNotes('thunderbird', 'svg');
      
      // Apple Mail has excellent SVG support
      expect(appleMail).toContain('Apple Mail has excellent SVG support');
      expect(appleMail).toContain('crisp vector graphic at any size');
      expect(appleMail).toContain('All SVG features including gradients, masks, and filters are supported');
      
      // Thunderbird has good SVG support
      expect(thunderbird).toContain('Thunderbird has good SVG support');
      expect(thunderbird).toContain('vector graphic, maintaining quality at any size');
      expect(thunderbird).toContain('though some complex filters may render inconsistently');
    });
    
    it('should provide client-specific PNG rendering notes', () => {
      const gmail = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'png');
      const yahoo = PlatformDetailsService.getPlatformRenderingNotes('yahoo', 'png');
      const samsung = PlatformDetailsService.getPlatformRenderingNotes('samsung-mail', 'png');
      
      // Gmail PNG notes
      expect(gmail).toContain('Gmail has good support for PNG images');
      expect(gmail).toContain('ensure your PNG is optimized and sized appropriately');
      
      // Yahoo PNG notes
      expect(yahoo).toContain('Yahoo Mail supports PNG images well');
      expect(yahoo).toContain('Consider using a slightly higher resolution');
      
      // Samsung PNG notes
      expect(samsung).toContain('Samsung Mail has good support for PNG images');
      expect(samsung).toContain('Your logo will render consistently as a raster image');
    });
    
    it('should provide client-specific VML rendering notes', () => {
      const outlookDesktop = PlatformDetailsService.getPlatformRenderingNotes('outlook-desktop', 'vml');
      const outlookWeb = PlatformDetailsService.getPlatformRenderingNotes('outlook-web', 'vml');
      
      // Outlook Desktop VML notes
      expect(outlookDesktop).toContain('Outlook Desktop has good support for VML graphics');
      expect(outlookDesktop).toContain('Microsoft\'s Vector Markup Language');
      expect(outlookDesktop).toContain('Complex SVG features may be simplified in the VML conversion');
      
      // Outlook Web VML notes
      expect(outlookWeb).toContain('Outlook Web has limited support for VML graphics');
      expect(outlookWeb).toContain('rendering may vary between versions');
    });
    
    it('should handle all fallback types for all clients', () => {
      // Test all combinations of clients and fallback types
      const clients: EmailClient[] = ['apple-mail', 'gmail', 'outlook-desktop', 'outlook-web', 'yahoo', 'thunderbird', 'samsung-mail'];
      const fallbackTypes: FallbackType[] = ['svg', 'png', 'vml'];
      
      for (const client of clients) {
        for (const fallbackType of fallbackTypes) {
          const notes = PlatformDetailsService.getPlatformRenderingNotes(client, fallbackType);
          
          // Should always return a string
          expect(typeof notes).toBe('string');
          expect(notes.length).toBeGreaterThan(0);
        }
      }
    });
    
    it('should return appropriate notes for each fallback type', () => {
      // Test that each fallback type returns appropriate notes
      const svgNotes = PlatformDetailsService.getPlatformRenderingNotes('apple-mail', 'svg');
      const pngNotes = PlatformDetailsService.getPlatformRenderingNotes('gmail', 'png');
      const vmlNotes = PlatformDetailsService.getPlatformRenderingNotes('outlook-desktop', 'vml');
      
      expect(svgNotes).toContain('SVG support');
      expect(pngNotes).toContain('PNG');
      expect(vmlNotes).toContain('VML');
    });
    
    it('should handle unsupported fallback types gracefully', () => {
      // Test with an invalid fallback type
      const invalidFallback = 'invalid' as FallbackType;
      const notes = PlatformDetailsService.getPlatformRenderingNotes('apple-mail', invalidFallback);
      
      expect(notes).toBeDefined();
      expect(notes).toContain('No specific rendering information available for this fallback type');
    });
    
    it('should provide consistent information across related clients', () => {
      // Test that related clients (like Outlook variants) have consistent but distinct information
      const outlookDesktop = PlatformDetailsService.getPlatformRenderingNotes('outlook-desktop', 'vml');
      const outlookWeb = PlatformDetailsService.getPlatformRenderingNotes('outlook-web', 'vml');
      
      // Both should mention VML
      expect(outlookDesktop).toContain('VML');
      expect(outlookWeb).toContain('VML');
      
      // But they should be different
      expect(outlookDesktop).not.toBe(outlookWeb);
    });
  });
  
  describe('Private methods', () => {
    // Testing private methods through public interfaces
    
    it('should provide appropriate supported features based on client capabilities', () => {
      const svgSupportingClient = PlatformDetailsService.getPlatformDetails('apple-mail');
      const vmlSupportingClient = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      const limitedClient = PlatformDetailsService.getPlatformDetails('gmail');
      
      // Check that supported features align with client capabilities
      expect(svgSupportingClient.supportedFeatures).toContain('SVG images');
      expect(svgSupportingClient.supportedFeatures).not.toContain('VML graphics');
      
      expect(vmlSupportingClient.supportedFeatures).toContain('VML graphics');
      expect(vmlSupportingClient.supportedFeatures).not.toContain('SVG images');
      
      expect(limitedClient.supportedFeatures).not.toContain('SVG images');
      expect(limitedClient.supportedFeatures).not.toContain('VML graphics');
    });
    
    it('should provide appropriate limitations based on client capabilities', () => {
      const svgSupportingClient = PlatformDetailsService.getPlatformDetails('apple-mail');
      const vmlSupportingClient = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      const limitedClient = PlatformDetailsService.getPlatformDetails('gmail');
      
      // Check that limitations align with client capabilities
      expect(svgSupportingClient.limitations).not.toContain('No support for SVG images');
      
      expect(vmlSupportingClient.limitations).toContain('No support for SVG images');
      expect(vmlSupportingClient.limitations).not.toContain('No support for VML');
      
      expect(limitedClient.limitations).toContain('No support for SVG images');
    });
    
    it('should provide appropriate best practices based on client capabilities', () => {
      const svgSupportingClient = PlatformDetailsService.getPlatformDetails('apple-mail');
      const vmlSupportingClient = PlatformDetailsService.getPlatformDetails('outlook-desktop');
      const limitedClient = PlatformDetailsService.getPlatformDetails('gmail');
      
      // Check that best practices align with client capabilities
      expect(svgSupportingClient.bestPractices).toContain('Use SVG for vector graphics');
      expect(svgSupportingClient.bestPractices).not.toContain('Use VML for vector graphics');
      
      expect(vmlSupportingClient.bestPractices).toContain('Use VML for vector graphics');
      expect(vmlSupportingClient.bestPractices).not.toContain('Use SVG for vector graphics');
      
      expect(limitedClient.bestPractices).toContain('Provide PNG fallback images');
    });
  });
});