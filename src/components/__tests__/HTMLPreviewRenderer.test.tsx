import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import HTMLPreviewRenderer from '../HTMLPreviewRenderer';
import '@testing-library/jest-dom';
import { vi, beforeAll, afterAll } from 'vitest';

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
    const loadingIndicator = screen.getByLabelText('Loading preview');
    expect(loadingIndicator).toBeInTheDocument();
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
      expect(mockOnError).toHaveBeenCalled();
    });
  });
});