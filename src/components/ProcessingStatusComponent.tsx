'use client';

import React, { useState, useEffect } from 'react';
import { ProcessingStatusInfo, Warning } from '@/types';

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
  const [status, setStatus] = useState<ProcessingStatusInfo | null>(null);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);

  // Define step labels for user-friendly display
  const stepLabels: Record<ProcessingStatusInfo['step'], string> = {
    'validating': 'Validating File',
    'optimizing': 'Optimizing File',
    'generating-fallbacks': 'Generating Fallbacks',
    'creating-html': 'Creating HTML Code',
    'packaging': 'Packaging Files',
    'complete': 'Processing Complete',
    'error': 'Processing Error'
  };

  // Define step order for progress tracking
  const stepOrder: ProcessingStatusInfo['step'][] = [
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
        return 'text-red-600 bg-red-50/80 border-red-200/50';
      case 'medium':
        return 'text-amber-600 bg-amber-50/80 border-amber-200/50';
      case 'low':
        return 'text-yellow-600 bg-yellow-50/80 border-yellow-200/50';
      default:
        return 'text-gray-600 bg-gray-50/80 border-gray-200/50';
    }
  };

  // If no status yet, show loading
  if (!status) {
    return (
      <div className="w-full p-8 text-center">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200"></div>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <span className="ml-4 text-lg text-gray-700 font-medium">Initializing processing...</span>
        </div>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="w-full">
      <h2 className="text-xl sm:text-2xl font-semibold mb-6 bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
        Processing Status
      </h2>
      
      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-blue-600">{overallProgress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
      
      {/* Step indicators - scrollable on small screens */}
      <div className="mb-8 overflow-x-auto pb-2">
        <div className="flex flex-nowrap gap-3 min-w-max">
          {stepOrder.map((step, index) => {
            const isCurrentStep = status.step === step;
            const isCompleted = stepOrder.indexOf(status.step) > index;
            
            return (
              <div 
                key={step}
                className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center whitespace-nowrap transition-all duration-300 ${
                  isCurrentStep 
                    ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-300 shadow-lg scale-105' 
                    : isCompleted 
                      ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-300 shadow-sm' 
                      : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}
                aria-current={isCurrentStep ? "step" : undefined}
              >
                {isCompleted && (
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-2">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {isCurrentStep && (
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2 animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
                {stepLabels[step]}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Current step details */}
      <div className="mb-8 p-4 bg-gray-50/80 backdrop-blur-sm rounded-2xl border border-gray-200/50">
        <div className="flex justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            {stepLabels[status.step]}
          </span>
          <span className="text-sm font-semibold text-blue-600">{status.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner mb-3" role="progressbar" aria-valuenow={status.progress} aria-valuemin={0} aria-valuemax={100}>
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
            style={{ width: `${status.progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
        <p className="text-sm text-gray-600 font-medium">{status.message}</p>
      </div>
      
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-700 mb-4">Warnings</h3>
          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border backdrop-blur-sm shadow-sm ${getSeverityColor(warning.severity)}`}
                role="alert"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-current rounded-full flex items-center justify-center mr-3 mt-0.5 opacity-80">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{warning.message}</p>
                    <p className="text-xs mt-1 capitalize opacity-80">{warning.type.replace(/-/g, ' ')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 text-red-700 shadow-md" role="alert">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatusComponent;