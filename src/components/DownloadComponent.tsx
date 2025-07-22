'use client';

import React, { useState } from 'react';
import { PackageData } from '@/types';

interface DownloadComponentProps {
  processId: string;
  isGenerating?: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

const DownloadComponent: React.FC<DownloadComponentProps> = ({
  processId,
  isGenerating = false,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError
}) => {
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadComplete, setDownloadComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle download button click
  const handleDownload = async () => {
    try {
      setDownloading(true);
      setError(null);
      
      // Notify parent component
      if (onDownloadStart) {
        onDownloadStart();
      }
      
      // Create a download link
      const downloadUrl = `/api/download/${processId}`;
      
      // Create a hidden anchor element
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'email-logo-package.zip';
      document.body.appendChild(link);
      
      // Click the link to start the download
      link.click();
      
      // Remove the link
      document.body.removeChild(link);
      
      // Set download as complete
      setDownloadComplete(true);
      
      // Notify parent component
      if (onDownloadComplete) {
        onDownloadComplete();
      }
    } catch (err) {
      console.error('Download error:', err);
      
      // Set error message
      const errorMessage = err instanceof Error ? err.message : 'Failed to download package';
      setError(errorMessage);
      
      // Notify parent component
      if (onDownloadError) {
        onDownloadError(errorMessage);
      }
    } finally {
      setDownloading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-4">Download Package</h3>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Download a ZIP package containing:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1 ml-2">
          <li>HTML snippet with all fallbacks</li>
          <li>PNG fallback image</li>
          <li>Email client preview images</li>
          <li>Integration instructions</li>
        </ul>
      </div>
      
      {/* Download button */}
      <div className="flex justify-center">
        <button
          onClick={handleDownload}
          disabled={downloading || isGenerating}
          className={`px-6 py-3 rounded-md flex items-center justify-center transition-colors ${
            downloading || isGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
          style={{ minWidth: '180px' }}
        >
          {downloading || isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {isGenerating ? 'Generating...' : 'Downloading...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download ZIP Package
            </>
          )}
        </button>
      </div>
      
      {/* Download complete message */}
      {downloadComplete && !error && (
        <div className="mt-4 p-3 bg-success-50 border border-success-100 text-success-700 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-success-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>Package downloaded successfully!</p>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>Failed to download package: {error}</p>
          </div>
          <button 
            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            onClick={handleDownload}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadComponent;