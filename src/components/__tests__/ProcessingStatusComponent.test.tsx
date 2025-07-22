import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ProcessingStatusComponent from '../ProcessingStatusComponent';

// Mock fetch
global.fetch = vi.fn();

describe('ProcessingStatusComponent', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders loading state initially', () => {
    render(<ProcessingStatusComponent processId="test-id" />);
    expect(screen.getByText('Initializing processing...')).toBeInTheDocument();
  });

  test('fetches and displays status information', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: {
          step: 'optimizing',
          progress: 45,
          message: 'Optimizing SVG file'
        },
        warnings: [{
          type: 'svg-complexity',
          message: 'SVG contains complex gradients',
          severity: 'medium'
        }],
        lastUpdated: Date.now()
      })
    });

    render(<ProcessingStatusComponent processId="test-id" />);
    
    // Wait for fetch to complete and component to update
    await waitFor(() => {
      expect(screen.getByText('Optimizing SVG file')).toBeInTheDocument();
    });
    
    // Check that progress is displayed
    expect(screen.getByText('45%')).toBeInTheDocument();
    
    // Check that warning is displayed
    expect(screen.getByText('SVG contains complex gradients')).toBeInTheDocument();
  });

  test('handles fetch error', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'Process not found'
      })
    });

    render(<ProcessingStatusComponent processId="invalid-id" />);
    
    // Wait for fetch to complete and component to update
    await waitFor(() => {
      expect(screen.getByText('Process not found')).toBeInTheDocument();
    });
  });

  test('stops polling when processing is complete', async () => {
    // Mock successful fetch response with complete status
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: {
          step: 'complete',
          progress: 100,
          message: 'Processing complete'
        },
        warnings: [],
        lastUpdated: Date.now()
      })
    });

    const onCompleteMock = vi.fn();
    render(<ProcessingStatusComponent processId="test-id" onComplete={onCompleteMock} />);
    
    // Wait for fetch to complete and component to update
    await waitFor(() => {
      expect(screen.getByText('Processing complete')).toBeInTheDocument();
    });
    
    // Check that onComplete was called with success=true
    expect(onCompleteMock).toHaveBeenCalledWith(true);
  });

  test('stops polling and shows error when processing fails', async () => {
    // Mock successful fetch response with error status
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: {
          step: 'error',
          progress: 50,
          message: 'Processing failed',
          error: 'Failed to optimize SVG'
        },
        warnings: [],
        lastUpdated: Date.now()
      })
    });

    const onCompleteMock = vi.fn();
    render(<ProcessingStatusComponent processId="test-id" onComplete={onCompleteMock} />);
    
    // Wait for fetch to complete and component to update
    await waitFor(() => {
      expect(screen.getByText('Failed to optimize SVG')).toBeInTheDocument();
    });
    
    // Check that onComplete was called with success=false
    expect(onCompleteMock).toHaveBeenCalledWith(false);
  });
});