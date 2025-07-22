'use client';

import React, { useState } from 'react';
import FileUploadComponent from '@/components/FileUploadComponent';
import ProcessingStatusComponent from '@/components/ProcessingStatusComponent';
import PreviewComponent from '@/components/PreviewComponent';
import DownloadComponent from '@/components/DownloadComponent';
import { ValidationResult } from '@/types';
import usePreviewData from '@/lib/hooks/usePreviewData';

export default function Home() {
  // State for file upload
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<boolean>(false);

  // Get preview data
  const { previewData, isLoading: isLoadingPreviews, error: previewError } = usePreviewData(
    processingComplete ? processId : null
  );

  // Handle file upload
  const handleFileUpload = async (file: File, validationResult: ValidationResult) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadSuccess(false);
      setFileId(null);
      setProcessId(null);
      setProcessingComplete(false);
      setProcessingError(false);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 100);

      // Send file to API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      // Clear progress interval
      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // Set upload to complete
      setUploadProgress(100);
      
      // Get response data
      const data = await response.json();
      setFileId(data.fileId);
      setUploadSuccess(true);

      // Start processing the file
      try {
        // Call the process API with the file ID
        const processResponse = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileId: data.fileId,
            options: {
              altText: file.name.split('.')[0] || 'Logo',
              dimensions: { width: 200, height: 200 },
              optimizationLevel: 'medium',
              generatePreviews: true
            }
          }),
        });

        if (!processResponse.ok) {
          const processErrorData = await processResponse.json();
          throw new Error(processErrorData.error || 'Processing failed');
        }

        const processData = await processResponse.json();
        setProcessId(processData.processId);
        
        // If processing is already complete, update state
        if (processData.status === 'complete') {
          setProcessingComplete(true);
        }
      } catch (processError) {
        console.error('Processing error:', processError);
        setProcessingError(true);
      }

      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setProcessingError(true);
    }
  };

  // Handle processing completion
  const handleProcessingComplete = (success: boolean) => {
    setProcessingComplete(success);
    setProcessingError(!success);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-3 sm:p-4 md:p-8 lg:p-16">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center">CompatimageGen</h1>
        <p className="text-base sm:text-lg md:text-xl mb-4 sm:mb-6 md:mb-8 text-center">
          Generate email-compatible logo HTML with fallbacks for all major email clients
        </p>
        
        {/* File Upload Component - Show only if not processing */}
        {!processId && (
          <FileUploadComponent 
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        )}
        
        {/* Upload success message - Show only if upload succeeded but processing hasn't started */}
        {uploadSuccess && !processId && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-success-50 border border-success-100 text-success-700 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 text-success-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm sm:text-base">File uploaded successfully! Processing will begin shortly.</p>
            </div>
          </div>
        )}
        
        {/* Processing Status Component - Show only when processing */}
        {processId && !processingComplete && !processingError && (
          <div className="mt-4 sm:mt-6">
            <ProcessingStatusComponent 
              processId={processId}
              onComplete={handleProcessingComplete}
              pollingInterval={1500} // Poll every 1.5 seconds
            />
          </div>
        )}
        
        {/* Preview Component - Show when processing is complete */}
        {processingComplete && previewData && (
          <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
            {/* Success message */}
            <div className="p-3 sm:p-4 bg-success-50 border border-success-100 text-success-700 rounded-md">
              <div className="flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0 text-success-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm sm:text-base">Processing complete! Your files are ready for download.</p>
              </div>
            </div>
            
            {/* Download component */}
            <DownloadComponent 
              processId={processId as string}
              onDownloadError={(error) => console.error('Download error:', error)}
            />
            
            {/* Preview component */}
            <PreviewComponent 
              previews={previewData.previews} 
              htmlCode={previewData.htmlCode} 
            />
            
            {/* Text previews */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Email Client Compatibility</h3>
              <div className="space-y-2">
                {previewData.textPreviews.map((text, index) => (
                  <div key={index} className="p-2 sm:p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="text-sm text-gray-700">{text}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Process another file button */}
            <div className="flex justify-center">
              <button 
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-colors"
                style={{ touchAction: "manipulation" }}
                onClick={() => {
                  // Reset state to allow new uploads
                  setProcessId(null);
                  setProcessingComplete(false);
                  setFileId(null);
                  setUploadSuccess(false);
                }}
                aria-label="Process another file"
              >
                Process Another File
              </button>
            </div>
          </div>
        )}
        
        {/* Loading previews message */}
        {processingComplete && isLoadingPreviews && (
          <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-500" aria-hidden="true"></div>
              <span className="ml-3 text-sm sm:text-base text-gray-700">Loading previews...</span>
            </div>
          </div>
        )}
        
        {/* Preview error message */}
        {processingComplete && previewError && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-md" role="alert">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">Failed to load previews: {previewError}</p>
            </div>
            <button 
              className="mt-3 sm:mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation"
              onClick={() => {
                // Reset state to allow new uploads
                setProcessId(null);
                setProcessingComplete(false);
                setFileId(null);
                setUploadSuccess(false);
              }}
              aria-label="Process another file"
            >
              Process Another File
            </button>
          </div>
        )}
        
        {/* Processing error message */}
        {processingError && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-md" role="alert">
            <div className="flex items-start">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm">Processing failed. Please try again with a different file.</p>
            </div>
            <button 
              className="mt-3 sm:mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation"
              onClick={() => {
                // Reset state to allow new uploads
                setProcessId(null);
                setProcessingComplete(false);
                setProcessingError(false);
                setFileId(null);
                setUploadSuccess(false);
              }}
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        )}
        
        {/* Features section - Show only when not processing */}
        {!processId && (
          <div className="mt-8 sm:mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Universal Compatibility</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Works across all major email clients including Gmail, Outlook, and Apple Mail
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Hosting Required</h3>
              <p className="text-sm sm:text-base text-gray-600">
                All assets are embedded as inline data URIs or included in the download package
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2">Multiple Format Support</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Upload SVG, PNG, JPEG, or CSS logos and get optimized outputs with fallbacks
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}