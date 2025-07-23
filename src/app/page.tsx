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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-purple-100/20" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-start p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 bg-clip-text text-transparent mb-4">
              CompatimageGen
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Generate email-compatible logo HTML with fallbacks for all major email clients
            </p>
          </div>
          
          {/* File Upload Component - Show only if not processing */}
          {!processId && (
            <div className="mb-8 animate-slide-up">
              <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
                <FileUploadComponent 
                  onFileUpload={handleFileUpload}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                />
              </div>
            </div>
          )}
          
          {/* Upload success message - Show only if upload succeeded but processing hasn't started */}
          {uploadSuccess && !processId && (
            <div className="mb-6 animate-scale-in">
              <div className="backdrop-blur-sm bg-green-50/80 border border-green-200/50 text-green-700 rounded-2xl p-4 sm:p-5 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base font-medium">File uploaded successfully! Processing will begin shortly.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Processing Status Component - Show only when processing */}
          {processId && !processingComplete && !processingError && (
            <div className="mb-8 animate-slide-up">
              <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
                <ProcessingStatusComponent 
                  processId={processId}
                  onComplete={handleProcessingComplete}
                  pollingInterval={1500} // Poll every 1.5 seconds
                />
              </div>
            </div>
          )}
          
          {/* Preview Component - Show when processing is complete */}
          {processingComplete && previewData && (
            <div className="space-y-6 animate-fade-in">
              {/* Success message */}
              <div className="backdrop-blur-sm bg-green-50/80 border border-green-200/50 text-green-700 rounded-2xl p-4 sm:p-5 shadow-md">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base font-medium">Processing complete! Your files are ready for download.</p>
                </div>
              </div>
              
              {/* Download component */}
              <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
                <DownloadComponent 
                  processId={processId as string}
                  onDownloadError={(error) => console.error('Download error:', error)}
                />
              </div>
              
              {/* Preview component */}
              <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
                <PreviewComponent 
                  previews={previewData.previews} 
                  htmlCode={previewData.htmlCode} 
                />
              </div>
              
              {/* Text previews */}
              <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-xl border border-white/20">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">
                  Email Client Compatibility
                </h3>
                <div className="space-y-3">
                  {previewData.textPreviews.map((text, index) => (
                    <div key={index} className="p-3 sm:p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm">
                      <p className="text-sm text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Process another file button */}
              <div className="flex justify-center pt-4">
                <button 
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                  onClick={() => {
                    // Reset state to allow new uploads
                    setProcessId(null);
                    setProcessingComplete(false);
                    setFileId(null);
                    setUploadSuccess(false);
                  }}
                  aria-label="Process another file"
                >
                  <span className="relative z-10">Process Another File</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </button>
              </div>
            </div>
          )}
          
          {/* Loading previews message */}
          {processingComplete && isLoadingPreviews && (
            <div className="backdrop-blur-sm bg-white/70 rounded-3xl p-6 sm:p-8 shadow-modern-xl border border-white/20 animate-pulse">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-200"></div>
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <span className="ml-4 text-base text-neutral-700 font-medium">Loading previews...</span>
              </div>
            </div>
          )}
          
          {/* Preview error message */}
          {processingComplete && previewError && (
            <div className="backdrop-blur-sm bg-error-50/80 border border-error-200/50 text-error-700 rounded-2xl p-4 sm:p-5 shadow-modern animate-scale-in" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-error-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Failed to load previews: {previewError}</p>
                  <button 
                    className="mt-3 px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:from-primary-700 hover:to-accent-700 active:scale-95 transition-all duration-200 shadow-modern font-medium"
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
            </div>
          )}
          
          {/* Processing error message */}
          {processingError && (
            <div className="backdrop-blur-sm bg-error-50/80 border border-error-200/50 text-error-700 rounded-2xl p-4 sm:p-5 shadow-modern animate-scale-in" role="alert">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-error-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Processing failed. Please try again with a different file.</p>
                  <button 
                    className="mt-3 px-6 py-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:from-primary-700 hover:to-accent-700 active:scale-95 transition-all duration-200 shadow-modern font-medium"
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
              </div>
            </div>
          )}
          
          {/* Features section - Show only when not processing */}
          {!processId && (
            <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="group backdrop-blur-sm bg-white/60 border border-white/30 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-neutral-800">Universal Compatibility</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Works across all major email clients including Gmail, Outlook, and Apple Mail
                </p>
              </div>
              
              <div className="group backdrop-blur-sm bg-white/60 border border-white/30 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-neutral-800">No Hosting Required</h3>
                <p className="text-neutral-600 leading-relaxed">
                  All assets are embedded as inline data URIs or included in the download package
                </p>
              </div>
              
              <div className="group backdrop-blur-sm bg-white/60 border border-white/30 rounded-2xl p-6 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-neutral-800">Multiple Format Support</h3>
                <p className="text-neutral-600 leading-relaxed">
                  Upload SVG, PNG, JPEG, or CSS logos and get optimized outputs with fallbacks
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}