import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useProcessingStatus } from '../useProcessingStatus';

// Mock fetch
global.fetch = vi.fn();

describe('useProcessingStatus', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('initializes with correct default values', () => {
    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id', 
      autoStart: false 
    }));
    
    expect(result.current.status).toBeNull();
    expect(result.current.warnings).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  test('starts polling automatically when autoStart is true', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: {
          step: 'validating',
          progress: 10,
          message: 'Validating file'
        },
        warnings: [],
        lastUpdated: Date.now()
      })
    });

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id', 
      autoStart: true 
    }));
    
    // Initial state should have isPolling true
    expect(result.current.isPolling).toBe(true);
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Verify fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/status/test-id');
  });

  test('updates status when polling returns data', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
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

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id'
    }));
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Check that status was updated
    expect(result.current.status).toEqual({
      step: 'optimizing',
      progress: 45,
      message: 'Optimizing SVG file'
    });
    
    // Check that warnings were updated
    expect(result.current.warnings).toEqual([{
      type: 'svg-complexity',
      message: 'SVG contains complex gradients',
      severity: 'medium'
    }]);
  });

  test('stops polling when processing is complete', async () => {
    // Mock successful fetch response with complete status
    (global.fetch as jest.Mock).mockResolvedValue({
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

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id'
    }));
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Check that isPolling is false and isComplete is true
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isComplete).toBe(true);
  });

  test('stops polling and sets error when processing fails', async () => {
    // Mock successful fetch response with error status
    (global.fetch as jest.Mock).mockResolvedValue({
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

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id'
    }));
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Check that isPolling is false and isError is true
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('Failed to optimize SVG');
  });

  test('handles fetch error', async () => {
    // Mock failed fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'Process not found'
      })
    });

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'invalid-id'
    }));
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Check that isPolling is false and isError is true
    expect(result.current.isPolling).toBe(false);
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe('Process not found');
  });

  test('startPolling and stopPolling functions work correctly', async () => {
    // Mock successful fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: {
          step: 'validating',
          progress: 10,
          message: 'Validating file'
        },
        warnings: [],
        lastUpdated: Date.now()
      })
    });

    const { result } = renderHook(() => useProcessingStatus({ 
      processId: 'test-id', 
      autoStart: false 
    }));
    
    // Initially not polling
    expect(result.current.isPolling).toBe(false);
    
    // Start polling
    act(() => {
      result.current.startPolling();
    });
    
    // Should be polling now
    expect(result.current.isPolling).toBe(true);
    
    // Wait for fetch to complete
    await vi.runAllTimersAsync();
    
    // Stop polling
    act(() => {
      result.current.stopPolling();
    });
    
    // Should not be polling anymore
    expect(result.current.isPolling).toBe(false);
    
    // Reset fetch call count
    (global.fetch as jest.Mock).mockClear();
    
    // Advance timers
    await vi.runAllTimersAsync();
    
    // Fetch should not have been called again
    expect(global.fetch).not.toHaveBeenCalled();
  });
});