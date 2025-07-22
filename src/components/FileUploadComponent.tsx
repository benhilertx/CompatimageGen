import React, { useState, useRef, useEffect } from 'react';
import { ValidationResult } from '@/types';
import { FileValidator } from '@/lib/utils/file-validator';
import { APP_CONFIG } from '@/config/app-config';
import useDragAndDrop from '@/lib/hooks/useDragAndDrop';

interface FileUploadComponentProps {
  onFileUpload: (file: File, validationResult: ValidationResult) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  onFileUpload,
  isUploading = false,
  uploadProgress = 0
}) => {
  // State for error handling
  const [error, setError] = useState<string | null>(null);
  
  // State for warnings
  const [warnings, setWarnings] = useState<string[]>([]);
  
  // Reference to the file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get accepted file types for display
  const acceptedFileTypes = Object.values(APP_CONFIG.upload.acceptedFileTypes).flat();
  const acceptedExtensions = ['svg', 'png', 'jpg', 'jpeg', 'css'];
  
  // Format file size limit for display
  const maxFileSizeMB = APP_CONFIG.upload.maxFileSize / (1024 * 1024);
  
  // Process uploaded files
  const handleFiles = (files: FileList) => {
    const file = files[0]; // Only process the first file
    
    // Reset previous errors and warnings
    setError(null);
    setWarnings([]);
    
    // Validate file
    const validationResult = FileValidator.validateFile(file);
    
    if (!validationResult.valid) {
      setError(validationResult.errors[0] || 'Invalid file');
      return;
    }
    
    // Set any warnings
    if (validationResult.warnings.length > 0) {
      setWarnings(validationResult.warnings);
    }
    
    // Pass the file to the parent component
    onFileUpload(file, validationResult);
  };
  
  // Use the enhanced drag and drop hook with touch support
  const { 
    dragActive, 
    handleDrag, 
    handleDrop, 
    handleTouchStart, 
    handleTouchEnd,
    isTouchDevice 
  } = useDragAndDrop({
    onFileDrop: handleFiles
  });
  
  // Handle file input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };
  
  // Handle file button click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle area click for mobile devices
  const handleAreaClick = () => {
    if (isTouchDevice) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* File upload form */}
      <form
        className={`relative w-full h-48 sm:h-60 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 sm:p-6 transition-all duration-300 ease-in-out ${
          dragActive 
            ? 'border-primary-500 bg-primary-50' 
            : error 
              ? 'border-error-500 bg-error-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isTouchDevice ? 'cursor-pointer active:bg-primary-50 active:border-primary-400' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleAreaClick}
        onSubmit={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label="Upload file area"
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={acceptedFileTypes.join(',')}
          aria-label="File input"
        />
        
        {/* Upload icon */}
        <div className="mb-3 sm:mb-4 text-center">
          <svg
            className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto ${
              error ? 'text-error-500' : dragActive ? 'text-primary-500' : 'text-gray-400'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        
        {/* Upload text */}
        <div className="text-center">
          {isUploading ? (
            <div className="w-full">
              <p className="text-gray-700 mb-2">Uploading file...</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          ) : (
            <>
              <p className={`text-base sm:text-lg ${error ? 'text-error-700' : 'text-gray-700'}`}>
                {error || (isTouchDevice ? 'Tap here to upload your logo' : 'Drag and drop your logo file here')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                or
              </p>
              <button
                type="button"
                onClick={handleButtonClick}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 touch-manipulation"
                aria-label="Browse files"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-400 mt-3 sm:mt-4">
                Supports {acceptedExtensions.join(', ')} files (max {maxFileSizeMB}MB)
              </p>
            </>
          )}
        </div>
        
        {/* Warnings display */}
        {warnings.length > 0 && (
          <div className="mt-3 sm:mt-4 w-full">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center bg-warning-50 border border-warning-100 text-warning-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm mb-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0 text-warning-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="line-clamp-2">{warning}</span>
              </div>
            ))}
          </div>
        )}
      </form>
      
      {/* File type information */}
      <div className="mt-3 sm:mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-xs font-medium">SVG</span>
          <span className="ml-1 text-xs text-gray-500">Vector</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-xs font-medium">PNG</span>
          <span className="ml-1 text-xs text-gray-500">Raster</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-xs font-medium">JPEG</span>
          <span className="ml-1 text-xs text-gray-500">Raster</span>
        </div>
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded-md border border-gray-200">
          <span className="text-xs font-medium">CSS</span>
          <span className="ml-1 text-xs text-gray-500">Style</span>
        </div>
      </div>
      
      {/* Touch device hint */}
      {isTouchDevice && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Tap the upload area or use the browse button
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;