import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
});