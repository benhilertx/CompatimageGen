import { useState, useEffect } from 'react';
import { ProcessingStatusInfo, Warning } from '@/types';

interface UseProcessingStatusProps {
  processId: string | null;
  pollingInterval?: number;
  autoStart?: boolean;
}

interface UseProcessingStatusResult {
  status: ProcessingStatusInfo | null;
  warnings: Warning[];
  error: string | null;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  isComplete: boolean;
  isError: boolean;
}

/**
 * Hook to manage processing status polling
 */
export function useProcessingStatus({
  processId,
  pollingInterval = 1000,
  autoStart = true
}: UseProcessingStatusProps): UseProcessingStatusResult {
  const [status, setStatus] = useState<ProcessingStatusInfo | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(autoStart);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);

  // Start polling function
  const startPolling = () => {
    if (processId) {
      setIsPolling(true);
    }
  };

  // Stop polling function
  const stopPolling = () => {
    setIsPolling(false);
  };

  // Poll for status updates
  useEffect(() => {
    if (!processId || !isPolling) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/status/${processId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch status');
        }
        
        const data = await response.json();
        setStatus(data.status);
        setWarnings(data.warnings || []);
        
        // Check if processing is complete or has error
        if (data.status.step === 'complete') {
          setIsComplete(true);
          setIsPolling(false);
        } else if (data.status.step === 'error') {
          setIsError(true);
          setError(data.status.error || 'Unknown error occurred');
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setIsPolling(false);
        setIsError(true);
      }
    };

    // Initial fetch
    fetchStatus();
    
    // Set up polling interval
    const intervalId = setInterval(fetchStatus, pollingInterval);
    
    // Clean up interval on unmount or when polling stops
    return () => clearInterval(intervalId);
  }, [processId, isPolling, pollingInterval]);

  return {
    status,
    warnings,
    error,
    isPolling,
    startPolling,
    stopPolling,
    isComplete,
    isError
  };
}