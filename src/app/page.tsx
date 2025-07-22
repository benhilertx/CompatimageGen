'use client';

import React, { useState } from 'react';
import FileUploadComponent from '@/components/FileUploadComponent';
import ProcessingStatusComponent from '@/components/ProcessingStatusComponent';
import { ValidationResult } from '@/types';

export default function Home() {
  // State for file upload
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processingComplete, setProcessingComplete] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<boolean>(false);

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

      // Simulate starting a processing job
      // In a real implementation, you would call an API to start processing
      // and get back a processId
      setTimeout(() => {
        // This is a mock process ID - in a real app, this would come from the API
        setProcessId('test-process-id');
      }, 1000);

      // Reset upload state after a delay
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setProcessingError(true);
      // Error handling would be implemented here
    }
  };

  // Handle processing completion
  const handleProcessingComplete = (success: boolean) => {
    setProcessingComplete(success);
    setProcessingError(!success);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">CompatimageGen</h1>
        <p className="text-xl mb-8 text-center">
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
          <div className="mt-6 p-4 bg-success-50 border border-success-100 text-success-700 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-success-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>File uploaded successfully! Processing will begin shortly.</p>
            </div>
          </div>
        )}
        
        {/* Processing Status Component - Show only when processing */}
        {processId && !processingComplete && !processingError && (
          <div className="mt-6">
            <ProcessingStatusComponent 
              processId={processId}
              onComplete={handleProcessingComplete}
              pollingInterval={1500} // Poll every 1.5 seconds
            />
          </div>
        )}
        
        {/* Processing Complete Message */}
        {processingComplete && (
          <div className="mt-6 p-4 bg-success-50 border border-success-100 text-success-700 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-success-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>Processing complete! Your files are ready for download.</p>
            </div>
            <button 
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              onClick={() => {
                // Reset state to allow new uploads
                setProcessId(null);
                setProcessingComplete(false);
                setFileId(null);
                setUploadSuccess(false);
              }}
            >
              Process Another File
            </button>
          </div>
        )}
        
        {/* Features section - Show only when not processing */}
        {!processId && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Universal Compatibility</h3>
              <p className="text-gray-600">
                Works across all major email clients including Gmail, Outlook, and Apple Mail
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">No Hosting Required</h3>
              <p className="text-gray-600">
                All assets are embedded as inline data URIs or included in the download package
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Multiple Format Support</h3>
              <p className="text-gray-600">
                Upload SVG, PNG, JPEG, or CSS logos and get optimized outputs with fallbacks
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}