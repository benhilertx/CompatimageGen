'use client';

import { useState, useEffect } from 'react';
import { ClientPreview } from '@/types';

interface PreviewData {
  previews: ClientPreview[];
  textPreviews: string[];
  htmlCode: string;
}

interface UsePreviewDataResult {
  previewData: PreviewData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch preview data for a processed file
 * @param processId Process ID to fetch previews for
 * @returns Preview data, loading state, and error
 */
export function usePreviewData(processId: string | null): UsePreviewDataResult {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldRefetch, setShouldRefetch] = useState<boolean>(false);

  useEffect(() => {
    // Don't fetch if no process ID
    if (!processId) {
      return;
    }

    const fetchPreviewData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/preview/${processId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch preview data');
        }

        const data = await response.json();
        setPreviewData(data);
      } catch (err) {
        console.error('Error fetching preview data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch preview data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [processId, shouldRefetch]);

  // Function to manually refetch data
  const refetch = () => {
    setShouldRefetch(prev => !prev);
  };

  return { previewData, isLoading, error, refetch };
}

export default usePreviewData;