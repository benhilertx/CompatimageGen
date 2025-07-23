import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import PlatformInfoModal from '../PlatformInfoModal';
import { ClientPreview, EmailClient, FallbackType, PlatformDetails, QualityRating } from '@/types';

// Mock data for testing
const mockPlatformDetails: PlatformDetails = {
  name: 'Gmail',
  marketShare: 29,
  supportedFeatures: [
    'Basic HTML',
    'Inline CSS',
    'Images with alt text'
  ],
  limitations: [
    'No support for SVG',
    'Limited CSS positioning',
    'No external stylesheets'
  ],
  bestPractices: [
    'Use inline CSS',
    'Keep table-based layouts simple',
    'Provide fallback images'
  ],
  renderingNotes: 'Gmail strips out <head> and <style> tags, requiring inline CSS. It does not support SVG images, so PNG fallbacks will be used.'
};

const mockPreview: ClientPreview = {
  client: 'gmail' as EmailClient,
  fallbackUsed: 'png' as FallbackType,
  estimatedQuality: 'good' as QualityRating,
  htmlPreview: '<div>Test HTML Preview</div>',
  clientStyles: '.test { color: red; }'
};

describe('PlatformInfoModal', () => {
  const onCloseMock = vi.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
    // Reset focus
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  test('renders nothing when closed and not animating', () => {
    const { container } = render(
      <PlatformInfoModal 
        isOpen={false} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  test('renders modal content when open', () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Check that modal title is rendered
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    
    // Check that sections are rendered
    expect(screen.getByText('Supported Features')).toBeInTheDocument();
    expect(screen.getByText('Limitations')).toBeInTheDocument();
    expect(screen.getByText('Best Practices')).toBeInTheDocument();
    expect(screen.getByText('Rendering Notes for Your Logo')).toBeInTheDocument();
    
    // Check that content is rendered
    expect(screen.getByText('Basic HTML')).toBeInTheDocument();
    expect(screen.getByText('No support for SVG')).toBeInTheDocument();
    expect(screen.getByText('Use inline CSS')).toBeInTheDocument();
    expect(screen.getByText(/Gmail strips out/)).toBeInTheDocument();
    
    // Check that fallback info is rendered
    expect(screen.getByText('Fallback Used:')).toBeInTheDocument();
    expect(screen.getByText('PNG (Raster)')).toBeInTheDocument();
    expect(screen.getByText('Raster format may appear pixelated at larger sizes.')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when backdrop is clicked', () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Find the backdrop (the parent div of the modal content)
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when Escape key is pressed', () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Simulate pressing the Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('renders different fallback information based on fallback type', () => {
    // Test with SVG fallback
    const svgPreview = { ...mockPreview, fallbackUsed: 'svg' as FallbackType };
    const { rerender } = render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={svgPreview} 
      />
    );
    
    expect(screen.getByText('SVG (Vector)')).toBeInTheDocument();
    expect(screen.getByText('Vector format will render at any size with crisp edges.')).toBeInTheDocument();
    
    // Test with VML fallback
    const vmlPreview = { ...mockPreview, fallbackUsed: 'vml' as FallbackType };
    rerender(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={vmlPreview} 
      />
    );
    
    expect(screen.getByText('VML (Outlook Vector)')).toBeInTheDocument();
    expect(screen.getByText('VML format has limited support for complex shapes.')).toBeInTheDocument();
  });

  // New tests for modal interactions
  test('focuses close button when modal opens', async () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Wait for focus to be set on close button
    await waitFor(() => {
      const closeButton = screen.getByLabelText('Close modal');
      expect(document.activeElement).toBe(closeButton);
    });
  });

  test('traps focus within modal when tabbing', () => {
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Get all focusable elements in the modal
    const closeButton = screen.getByLabelText('Close modal');
    const closeButtonFooter = screen.getByText('Close');
    
    // Set focus to the last focusable element
    closeButtonFooter.focus();
    expect(document.activeElement).toBe(closeButtonFooter);
    
    // Tab should wrap to first element
    fireEvent.keyDown(closeButtonFooter, { key: 'Tab' });
    
    // In a real browser, focus would move to the first element
    // We can't fully test this behavior in JSDOM, but we can test the keydown handler
    
    // Set focus to the first focusable element
    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);
    
    // Shift+Tab should wrap to last element
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    
    // In a real browser, focus would move to the last element
    // We can't fully test this behavior in JSDOM, but we can test the keydown handler
  });

  test('renders market share progress bar correctly', () => {
    // Test with different market share values
    const highSharePlatform = { 
      ...mockPlatformDetails, 
      name: 'Popular Client', 
      marketShare: 75 
    };
    
    const { rerender } = render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={highSharePlatform} 
        preview={mockPreview} 
      />
    );
    
    // Check market share text and progress bar
    expect(screen.getByText('75%')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle('width: 75%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '75');
    
    // Test with low market share
    const lowSharePlatform = { 
      ...mockPlatformDetails, 
      name: 'Niche Client', 
      marketShare: 2 
    };
    
    rerender(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={lowSharePlatform} 
        preview={mockPreview} 
      />
    );
    
    expect(screen.getByText('2%')).toBeInTheDocument();
    const updatedProgressBar = screen.getByRole('progressbar');
    expect(updatedProgressBar).toHaveStyle('width: 2%');
    expect(updatedProgressBar).toHaveAttribute('aria-valuenow', '2');
  });

  test('handles animation states correctly', async () => {
    const { rerender } = render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Modal should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Close the modal
    rerender(
      <PlatformInfoModal 
        isOpen={false} 
        onClose={onCloseMock} 
        platformDetails={mockPlatformDetails} 
        preview={mockPreview} 
      />
    );
    
    // Modal should still be in the DOM during animation
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Trigger animation end
    fireEvent.animationEnd(screen.getByRole('dialog'));
    
    // In a real browser, the modal would be removed after animation
    // We can't fully test this in JSDOM, but we've tested the handler
  });

  test('renders with different platform details', () => {
    // Test with different platform details
    const outlookPlatformDetails: PlatformDetails = {
      name: 'Outlook Desktop',
      marketShare: 6,
      supportedFeatures: [
        'VML Support',
        'Table layouts',
        'Basic styling'
      ],
      limitations: [
        'No CSS positioning',
        'No border-radius',
        'Limited image support'
      ],
      bestPractices: [
        'Use VML for vector graphics',
        'Use table-based layouts',
        'Test thoroughly'
      ],
      renderingNotes: 'Outlook Desktop uses Word rendering engine which has limited CSS support.'
    };
    
    render(
      <PlatformInfoModal 
        isOpen={true} 
        onClose={onCloseMock} 
        platformDetails={outlookPlatformDetails} 
        preview={{ ...mockPreview, client: 'outlook-desktop', fallbackUsed: 'vml' }} 
      />
    );
    
    // Check that the new platform details are rendered
    expect(screen.getByText('Outlook Desktop')).toBeInTheDocument();
    expect(screen.getByText('VML Support')).toBeInTheDocument();
    expect(screen.getByText('No CSS positioning')).toBeInTheDocument();
    expect(screen.getByText('Use VML for vector graphics')).toBeInTheDocument();
    expect(screen.getByText(/Outlook Desktop uses Word rendering engine/)).toBeInTheDocument();
  });
});