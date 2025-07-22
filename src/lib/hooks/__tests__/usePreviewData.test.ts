import { renderHook, act } from '@testing-library/react';
import { usePreviewData } from '../usePreviewData';

// Mock fetch
global.fetch = jest.fn();

describe('usePreviewData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state when processId is null', () => {
    const { result } = renderHook(() => usePreviewData(null));
    
    expect(result.current.previewData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should fetch preview data when processId is provided', async () => {
    // Mock successful response
    const mockPreviewData = {
      previews: [
        {
          client: 'apple-mail',
          fallbackUsed: 'svg',
          estimatedQuality: 'excellent',
          previewImage: 'mock-image-data'
        }
      ],
      textPreviews: ['Apple Mail: Will use SVG vector format with excellent rendering quality.'],
      htmlCode: '<div>Mock HTML</div>'
    };
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPreviewData
    });
    
    const { result, waitForNextUpdate } = renderHook(() => usePreviewData('test-process-id'));
    
    // Should start loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the fetch to complete
    await waitForNextUpdate();
    
    // Should have fetched data
    expect(result.current.previewData).toEqual(mockPreviewData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/preview/test-process-id');
  });

  it('should handle fetch errors', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Test error' })
    });
    
    const { result, waitForNextUpdate } = renderHook(() => usePreviewData('error-process-id'));
    
    // Should start loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the fetch to complete
    await waitForNextUpdate();
    
    // Should have error
    expect(result.current.previewData).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Test error');
  });

  it('should refetch data when refetch is called', async () => {
    // Mock successful responses
    const mockPreviewData1 = {
      previews: [{ client: 'apple-mail', fallbackUsed: 'svg', estimatedQuality: 'excellent' }],
      textPreviews: ['Preview 1'],
      htmlCode: '<div>HTML 1</div>'
    };
    
    const mockPreviewData2 = {
      previews: [{ client: 'gmail', fallbackUsed: 'png', estimatedQuality: 'good' }],
      textPreviews: ['Preview 2'],
      htmlCode: '<div>HTML 2</div>'
    };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData1
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData2
      });
    
    const { result, waitForNextUpdate } = renderHook(() => usePreviewData('test-process-id'));
    
    // Wait for first fetch
    await waitForNextUpdate();
    expect(result.current.previewData).toEqual(mockPreviewData1);
    
    // Call refetch
    act(() => {
      result.current.refetch();
    });
    
    // Should start loading again
    expect(result.current.isLoading).toBe(true);
    
    // Wait for second fetch
    await waitForNextUpdate();
    expect(result.current.previewData).toEqual(mockPreviewData2);
  });
});