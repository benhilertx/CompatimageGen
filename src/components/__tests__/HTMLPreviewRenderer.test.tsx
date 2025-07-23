import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import HTMLPreviewRenderer from '../HTMLPreviewRenderer';
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll, describe, it, expect } from 'vitest';

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('HTMLPreviewRenderer', () => {
  const mockHtmlContent = '<div class="test-content">Test HTML Content</div>';
  const mockClientStyles = '.test-content { color: blue; }';
  
  it('renders the component with iframe', () => {
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="gmail"
      />
    );
    
    // Check if the component renders
    const container = screen.getByTestId('html-preview-gmail');
    expect(container).toBeInTheDocument();
    
    // Check if iframe is rendered
    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('sandbox', 'allow-same-origin');
  });
  
  it('shows loading indicator initially', () => {
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="outlook-desktop"
      />
    );
    
    // Check if loading indicator is shown
    const loadingSpinner = screen.getByLabelText('Loading preview');
    expect(loadingSpinner).toBeInTheDocument();
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
  });
  
  it('applies custom width and height', () => {
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="apple-mail"
        width="500px"
        height="400px"
      />
    );
    
    const container = screen.getByTestId('html-preview-apple-mail');
    expect(container).toHaveStyle('width: 500px');
    expect(container).toHaveStyle('height: 400px');
  });
  
  it('calls onLoad callback when iframe loads', async () => {
    const mockOnLoad = vi.fn();
    
    // Mock iframe onload behavior
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      get: function() {
        return {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn(),
          readyState: 'complete'
        };
      }
    });
    
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="gmail"
        onLoad={mockOnLoad}
      />
    );
    
    // Wait for the onLoad callback to be called
    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalled();
    });
  });
  
  it('handles error state', async () => {
    // Mock iframe to throw an error
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      get: function() {
        throw new Error('Test error');
      }
    });
    
    const mockOnError = vi.fn();
    
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="gmail"
        onError={mockOnError}
      />
    );
    
    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText('Unable to render preview')).toBeInTheDocument();
      expect(screen.getByText('The email client may not support this content')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  // New tests for various inputs
  it('renders different HTML content correctly', async () => {
    // Mock successful iframe content document
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      get: function() {
        return {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn(),
          readyState: 'complete'
        };
      }
    });

    const complexHtmlContent = `
      <div class="logo-container">
        <img src="data:image/png;base64,abc123" alt="Company Logo" />
        <div class="logo-text">Company Name</div>
      </div>
    `;
    
    const { rerender } = render(
      <HTMLPreviewRenderer
        htmlContent={complexHtmlContent}
        clientStyles={mockClientStyles}
        clientId="gmail"
      />
    );
    
    // Check if iframe is rendered with the complex content
    const iframe = screen.getByTestId('html-preview-gmail').querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    
    // Test with empty content
    rerender(
      <HTMLPreviewRenderer
        htmlContent=""
        clientStyles={mockClientStyles}
        clientId="gmail"
      />
    );
    
    // Iframe should still be rendered even with empty content
    expect(screen.getByTestId('html-preview-gmail').querySelector('iframe')).toBeInTheDocument();
  });
  
  it('applies different client styles correctly', () => {
    // Test with different client styles
    const outlookStyles = `
      .email-preview * {
        border-radius: 0 !important;
        box-shadow: none !important;
      }
    `;
    
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={outlookStyles}
        clientId="outlook-desktop"
      />
    );
    
    // Check if the component renders with Outlook styles
    expect(screen.getByTestId('html-preview-outlook-desktop')).toBeInTheDocument();
  });
  
  it('handles transition from loading to loaded state', async () => {
    const mockOnLoad = vi.fn();
    
    // Mock iframe with delayed loading
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentDocument', {
      get: function() {
        return {
          open: vi.fn(),
          write: vi.fn(),
          close: vi.fn(),
          readyState: 'loading' // Start with loading state
        };
      }
    });
    
    render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="gmail"
        onLoad={mockOnLoad}
      />
    );
    
    // Loading indicator should be visible initially
    expect(screen.getByText('Loading preview...')).toBeInTheDocument();
    
    // Simulate iframe load event
    const iframe = screen.getByTestId('html-preview-gmail').querySelector('iframe');
    fireEvent.load(iframe!);
    
    // Wait for the loading state to change
    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalled();
    });
  });
  
  it('handles different client IDs correctly', () => {
    // Test with different client IDs
    const { rerender } = render(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="apple-mail"
      />
    );
    
    expect(screen.getByTestId('html-preview-apple-mail')).toBeInTheDocument();
    
    rerender(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="outlook-web"
      />
    );
    
    expect(screen.getByTestId('html-preview-outlook-web')).toBeInTheDocument();
    
    rerender(
      <HTMLPreviewRenderer
        htmlContent={mockHtmlContent}
        clientStyles={mockClientStyles}
        clientId="yahoo"
      />
    );
    
    expect(screen.getByTestId('html-preview-yahoo')).toBeInTheDocument();
  });
});