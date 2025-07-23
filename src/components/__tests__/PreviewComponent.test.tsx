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
    return <div data-testid={`html-preview-mock-${props.clientId}`}>HTML Preview Mock</div>;
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
  it('renders the component with title', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Check if the component title is rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
  });

  it('toggles HTML code visibility when button is clicked', () => {
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Initially the HTML code section should have opacity-0 class
    const codeSection = screen.getByText(mockHtmlCode).closest('.transition-all');
    expect(codeSection).toHaveClass('opacity-0');
    
    // Click on Show HTML Code button
    fireEvent.click(screen.getByText('Show HTML Code'));
    
    // After clicking, the button text should change
    expect(screen.getByText('Hide HTML Code')).toBeInTheDocument();
  });

  it('copies HTML code to clipboard when copy button is clicked', () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined)
    };
    Object.assign(navigator, { clipboard: mockClipboard });
    
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Show HTML code
    fireEvent.click(screen.getByText('Show HTML Code'));
    
    // Click copy button
    fireEvent.click(screen.getByLabelText('Copy HTML code to clipboard'));
    
    // Check if clipboard API was called with correct HTML
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockHtmlCode);
  });
});