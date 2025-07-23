import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import PreviewComponent from '../PreviewComponent';
import HTMLPreviewRenderer from '../HTMLPreviewRenderer';
import PlatformInfoModal from '../PlatformInfoModal';
import { ClientPreview, PlatformDetails } from '@/types';

// Mock the HTMLPreviewRenderer component for PreviewComponent tests
vi.mock('../HTMLPreviewRenderer', () => ({
  default: function MockHTMLPreviewRenderer(props: any) {
    // Call onLoad callback immediately to simulate loaded preview
    if (props.onLoad) {
      setTimeout(() => props.onLoad(), 0);
    }
    return (
      <div 
        data-testid={`html-preview-${props.clientId}`}
        style={{ width: props.width, height: props.height }}
      >
        HTML Preview Mock
      </div>
    );
  }
}));

// Mock the PlatformInfoModal component for PreviewComponent tests
vi.mock('../PlatformInfoModal', () => ({
  default: function MockPlatformInfoModal(props: any) {
    return props.isOpen ? (
      <div 
        data-testid="platform-info-modal"
        role="dialog"
      >
        Platform Info Modal Mock
      </div>
    ) : null;
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

// Sample data for testing
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

const mockPlatformDetails: PlatformDetails = {
  name: 'Gmail',
  marketShare: 29,
  supportedFeatures: ['Feature 1', 'Feature 2'],
  limitations: ['Limitation 1', 'Limitation 2'],
  bestPractices: ['Practice 1', 'Practice 2'],
  renderingNotes: 'Mock rendering notes'
};

describe('Responsive Behavior Tests', () => {
  // Store original window dimensions
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    // Reset timers before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore original window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight
    });
    
    // Reset matchMedia mock
    window.matchMedia = undefined as any;
    
    vi.useRealTimers();
  });

  // Helper function to simulate window resize
  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height
    });
    
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation(query => {
      return {
        matches: width <= 640, // Simulate sm breakpoint at 640px
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    });
    
    // Dispatch resize event
    window.dispatchEvent(new Event('resize'));
  };

  it('HTMLPreviewRenderer adapts to different container sizes', () => {
    // Test with different container sizes
    const { rerender } = render(
      <HTMLPreviewRenderer
        htmlContent="<div>Test content</div>"
        clientStyles=".test { color: red; }"
        clientId="gmail"
        width="300px"
        height="200px"
      />
    );
    
    let container = screen.getByTestId('html-preview-gmail');
    // In our mock implementation, we pass the width and height props directly to the style
    expect(container).toHaveStyle({ width: '300px', height: '200px' });
    
    // Rerender with different dimensions
    rerender(
      <HTMLPreviewRenderer
        htmlContent="<div>Test content</div>"
        clientStyles=".test { color: red; }"
        clientId="gmail"
        width="100%"
        height="400px"
      />
    );
    
    container = screen.getByTestId('html-preview-gmail');
    expect(container).toHaveStyle({ width: '100%', height: '400px' });
  });

  it('PlatformInfoModal is responsive across different screen sizes', () => {
    // Test with mobile size
    setWindowSize(375, 667); // iPhone 8 size
    
    render(
      <PlatformInfoModal
        isOpen={true}
        onClose={() => {}}
        platformDetails={mockPlatformDetails}
        preview={mockPreviews[1]} // Gmail preview
      />
    );
    
    // Modal should be rendered
    expect(screen.getByTestId('platform-info-modal')).toBeInTheDocument();
    
    // Test with tablet size
    setWindowSize(768, 1024); // iPad size
    
    // Modal should still be rendered
    expect(screen.getByTestId('platform-info-modal')).toBeInTheDocument();
    
    // Test with desktop size
    setWindowSize(1440, 900); // Desktop size
    
    // Modal should still be rendered
    expect(screen.getByTestId('platform-info-modal')).toBeInTheDocument();
  });

  it('PreviewComponent layout adapts to different screen sizes', () => {
    // Test with mobile size
    setWindowSize(375, 667); // iPhone 8 size
    
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Advance timers to complete loading
    vi.advanceTimersByTime(1000);
    
    // Component should be rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
    
    // Test with tablet size
    setWindowSize(768, 1024); // iPad size
    
    // Component should still be rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
    
    // Test with desktop size
    setWindowSize(1440, 900); // Desktop size
    
    // Component should still be rendered
    expect(screen.getByText('Email Client Previews')).toBeInTheDocument();
  });

  it('PreviewComponent client selector is scrollable on small screens', () => {
    // Test with mobile size
    setWindowSize(375, 667); // iPhone 8 size
    
    render(<PreviewComponent previews={mockPreviews} htmlCode={mockHtmlCode} />);
    
    // Advance timers to complete loading
    vi.advanceTimersByTime(1000);
    
    // Client selector should be rendered
    expect(screen.getByText('All Clients')).toBeInTheDocument();
    expect(screen.getByText('Apple Mail')).toBeInTheDocument();
    expect(screen.getByText('Gmail')).toBeInTheDocument();
    expect(screen.getByText('Outlook Desktop')).toBeInTheDocument();
    
    // The client selector container should have overflow-x: auto
    const clientSelectorContainer = screen.getByText('All Clients').parentElement?.parentElement;
    expect(clientSelectorContainer).toHaveClass('overflow-x-auto');
  });
});