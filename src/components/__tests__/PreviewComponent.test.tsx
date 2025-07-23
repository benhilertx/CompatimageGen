import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PreviewComponent from '../PreviewComponent';
import { ClientPreview } from '@/types';
import { describe, expect, it, vi } from 'vitest';

// Mock the HTMLPreviewRenderer component
vi.mock('../HTMLPreviewRenderer', () => ({
  default: function MockHTMLPreviewRenderer(props: any) {
    // Call onLoad callback immediately to simulate loaded preview
    if (props.onLoad) {
      setTimeout(() => props.onLoad(), 0);
    }
    return <div data-testid={`html-preview-${props.clientId}`}>HTML Preview Mock</div>;
  }
}));

// Mock the PlatformInfoModal component
vi.mock('../PlatformInfoModal', () => ({
  default: function MockPlatformInfoModal(props: any) {
    return props.isOpen ? <div data-testid="platform-info-modal">Platform Info Modal Mock</div> : null;
  }
}));

// Mock the PlatformDetailsService
vi.mock('@/lib/services/platform-details-service', () => ({
  default: {
    getPlatformDetails: vi.fn().mockReturnValue({
      name: 'Mock Platform',
      marketShare: 10,
      supportedFeatures: ['Feature 1', 'Feature 2'],
      limitations: ['Limitation 1', 'Limitation 2'],
      bestPractices: ['Practice 1', 'Practice 2'],
      renderingNotes: 'Mock rendering notes'
    })
  }
}));

// Mock data for testing
const mockPreviews: ClientPreview[] = [
  {
    client: 'apple-mail',
    fallbackUsed: 'svg',
    estimatedQuality: 'excellent',
    previewImage: Buffer.from('mock-image-data'),
    htmlPreview: '<div>Apple Mail Preview</div>',
    clientStyles: '.email-preview { font-family: sans-serif; }'
  },
  {
    client: 'gmail',
    fallbackUsed: 'png',
    estimatedQuality: 'good',
    previewImage: Buffer.from('mock-image-data'),
    htmlPreview: '<div>Gmail Preview</div>',
    clientStyles: '.email-preview { font-family: sans-serif; }'
  },
  {
    client: 'outlook-desktop',
    fallbackUsed: 'vml',
    estimatedQuality: 'fair',
    previewImage: Buffer.from('mock-image-data'),
    htmlPreview: '<div>Outlook Preview</div>',
    clientStyles: '.email-preview { font-family: sans-serif; }'
  }
];

const mockHtmlCode = '<div>Mock HTML code</div>';

describe('PreviewComponent', () => {
  it('renders the component with all previews', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
    
    // Check if all client buttons are rendered
    expect(screen.getByText('All Clients')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook Desktop')).toBeInTheDocument();
    
    // Check if all preview cards are rendered
    expect(screen.getAllByText(/Fallback Used:/i)).toHaveLength(3);
    expect(screen.getAllByText(/Rendering Quality:/i)).toHaveLength(3);
  });

  it('filters previews when a client is selected', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Click on Gmail button
    fireEvent.click(screen.getByText('Gmail'));
    
    // Should only show Gmail preview
    const fallbackTexts = screen.getAllByText(/Fallback Used:/i);
    expect(fallbackTexts).toHaveLength(1);
    
    // Check if the correct fallback type is displayed
    expect(screen.getByText('PNG (Raster)')).toBeInTheDocument();
    expect(screen.queryByText('SVG (Vector)')).not.toBeInTheDocument();
  });

  it('shows HTML code when toggle button is clicked', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // HTML code should not be visible initially
    expect(screen.queryByText(mockHtmlCode)).not.toBeInTheDocument();
    
    // Click on Show HTML Code button
    fireEvent.click(screen.getByText('Show HTML Code'));
    
    // HTML code should now be visible
    expect(screen.getByText(mockHtmlCode)).toBeInTheDocument();
    
    // Button text should change
    expect(screen.getByText('Hide HTML Code')).toBeInTheDocument();
  });

  it('displays correct quality ratings with appropriate colors', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if quality ratings are displayed correctly
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('handles empty previews array', () => {
    render(<PreviewComponent previews={[]} htmlCode={mockHtmlCode} />);
    
    // Should show no previews message
    expect(screen.getByText('No previews available for the selected client')).toBeInTheDocument();
  });

  it('renders HTML previews when available', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if HTML previews are rendered
    expect(screen.getByTestId('html-preview-apple-mail')).toBeInTheDocument();
    expect(screen.getByTestId('html-preview-gmail')).toBeInTheDocument();
    expect(screen.getByTestId('html-preview-outlook-desktop')).toBeInTheDocument();
  });

  it('opens platform info modal when info icon is clicked', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Info icons should be present (3 of them)
    const infoButtons = screen.getAllByLabelText(/Show details for/);
    expect(infoButtons).toHaveLength(3);
    
    // Modal should not be visible initially
    expect(screen.queryByTestId('platform-info-modal')).not.toBeInTheDocument();
    
    // Click on the first info icon
    fireEvent.click(infoButtons[0]);
    
    // Modal should now be visible
    expect(screen.getByTestId('platform-info-modal')).toBeInTheDocument();
  });
});