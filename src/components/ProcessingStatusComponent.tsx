'use client';

import React, { useState, useEffect } from 'react';
import { ProcessingStatus, Warning } from '@/types';

interface ProcessingStatusComponentProps {
  processId: string;
  onComplete?: (success: boolean) => void;
  pollingInterval?: number; // in milliseconds
}

const ProcessingStatusComponent: React.FC<ProcessingStatusComponentProps> = ({
  processId,
  onComplete,
  pollingInterval = 1000, // Default to 1 second
}) => {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  // Define step labels for user-friendly display
  const stepLabels: Record<ProcessingStatus['step'], string> = {
    'validating': 'Validating File',
    'optimizing': 'Optimizing File',
    'generating-fallbacks': 'Generating Fallbacks',
    'creating-html': 'Creating HTML Code',
    'packaging': 'Packaging Files',
    'complete': 'Processing Complete',
    'error': 'Processing Error'
  };

  // Define step order for progress tracking
  const stepOrder: ProcessingStatus['step'][] = [
    'validating',
    'optimizing',
    'generating-fallbacks',
    'creating-html',
    'packaging',
    'complete'
  ];

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
          setIsPolling(false);
          onComplete && onComplete(true);
        } else if (data.status.step === 'error') {
          setIsPolling(false);
          setError(data.status.error || 'Unknown error occurred');
          onComplete && onComplete(false);
        }
      } catch (err) {
        console.error('Error fetching status:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
        setIsPolling(false);
        onComplete && onComplete(false);
      }
    };

    // Initial fetch
    fetchStatus();
    
    // Set up polling interval
    const intervalId = setInterval(fetchStatus, pollingInterval);
    
    // Clean up interval on unmount or when polling stops
    return () => clearInterval(intervalId);
  }, [processId, isPolling, pollingInterval, onComplete]);

  // Calculate overall progress based on current step and progress
  const calculateOverallProgress = (): number => {
    if (!status) return 0;
    
    const currentStepIndex = stepOrder.indexOf(status.step);
    if (currentStepIndex === -1) return 0;
    
    // Each step contributes equally to overall progress
    const stepsCompleted = currentStepIndex;
    const stepsTotal = stepOrder.length - 1; // Exclude 'complete' from calculation
    
    // Calculate base progress from completed steps
    const baseProgress = (stepsCompleted / stepsTotal) * 100;
    
    // Add progress from current step
    const currentStepProgress = (status.progress / 100) * (1 / stepsTotal) * 100;
    
    return Math.min(Math.round(baseProgress + currentStepProgress), 100);
  };

  // Get severity color for warnings
  const getSeverityColor = (severity: Warning['severity']): string => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // If no status yet, show loading
  if (!status) {
    return (
      <div className="w-full p-6 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-700">Initializing processing...</span>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Processing Status</h2>
      
      {/* Overall progress bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs sm:text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-xs sm:text-sm font-medium text-gray-700">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>
      
      {/* Step indicators - scrollable on small screens */}
      <div className="mb-4 sm:mb-6 overflow-x-auto pb-2">
        <div className="flex flex-nowrap gap-2 min-w-max">
          {stepOrder.map((step, index) => {
            const isCurrentStep = status.step === step;
            const isCompleted = stepOrder.indexOf(status.step) > index;
            
            return (
              <div 
                key={step}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center whitespace-nowrap ${
                  isCurrentStep 
                    ? 'bg-primary-100 text-primary-800 border border-primary-300' 
                    : isCompleted 
                      ? 'bg-success-100 text-success-800 border border-success-300' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
                aria-current={isCurrentStep ? "step" : undefined}
              >
                {isCompleted && (
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {stepLabels[step]}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current step details */}
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between mb-1">
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            {stepLabels[status.step]}
          </span>
          <span className="text-xs sm:text-sm font-medium text-gray-700">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${status.progress}%` }}
          ></div>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">{status.message}</p>
      </div>
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Warnings</h3>
          <div className="space-y-2">
            {warnings.map((warning, index) => (
              <div 
                key={index}
                className={`p-2 sm:p-3 rounded-md border ${getSeverityColor(warning.severity)}`}
                role="alert"
              >
                <div className="flex items-start">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-xs sm:text-sm font-medium">{warning.message}</p>
                    <p className="text-xs mt-0.5 sm:mt-1 capitalize">{warning.type.replace(/-/g, ' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-3 sm:p-4 rounded-md bg-red-50 border border-red-200 text-red-700" role="alert">
          <div className="flex items-start">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-xs sm:text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatusComponent;