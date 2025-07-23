import React, { useState, useRef } from 'react';
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
  const handleFiles = async (files: FileList | null | undefined) => {
    // Check if files exist and have at least one file
    if (!files || files.length === 0) {
      setError("No file was selected or the file is empty");
      return;
    }
    
    const file = files[0]; // Only process the first file
    
    // Reset previous errors and warnings
    setError(null);
    setWarnings([]);
    
    try {
      // Validate file (await the Promise)
      const validationResult = await FileValidator.validateFile(file);
      
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
    } catch (error) {
      setError(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    
    // Pass the files to handleFiles even if empty - it will handle the validation
    handleFiles(e.target.files);
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
        className={`relative w-full h-52 sm:h-64 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 sm:p-8 transition-all duration-300 ease-in-out backdrop-blur-sm ${
          dragActive 
            ? 'border-blue-400 bg-blue-50/80 shadow-lg scale-[1.02]' 
            : error 
              ? 'border-red-400 bg-red-50/80 shadow-lg' 
              : 'border-gray-300 hover:border-blue-300 hover:bg-white/80 hover:shadow-lg'
        } ${isTouchDevice ? 'cursor-pointer active:bg-blue-50/80 active:border-blue-400 active:scale-[0.98]' : ''}`}
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
        <div className="mb-4 sm:mb-6 text-center">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 ${
            error 
              ? 'bg-red-100 text-red-500' 
              : dragActive 
                ? 'bg-blue-100 text-blue-600 scale-110' 
                : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
          }`}>
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10"
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
        </div>
        
        {/* Upload text */}
        <div className="text-center">
          {isUploading ? (
            <div className="w-full">
              <p className="text-gray-700 mb-3 font-medium">Uploading file...</p>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden" 
                  style={{ width: `${uploadProgress}%` }}
                  role="progressbar"
                  aria-valuenow={uploadProgress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{uploadProgress}% complete</p>
            </div>
          ) : (
            <>
              <p className={`text-lg sm:text-xl font-medium mb-2 ${error ? 'text-red-700' : 'text-gray-700'}`}>
                {error || (isTouchDevice ? 'Tap here to upload your logo' : 'Drag and drop your logo file here')}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or
              </p>
              <button
                type="button"
                onClick={handleButtonClick}
                className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 transition-all duration-200 shadow-lg font-medium"
                style={{ touchAction: "manipulation" }}
                aria-label="Browse files"
              >
                <span className="relative z-10">Browse Files</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </button>
              <p className="text-sm text-gray-500 mt-4">
                Supports {acceptedExtensions.join(', ')} files (max {maxFileSizeMB}MB)
              </p>
            </>
          )}
        </div>
        
        {/* Warnings display */}
        {warnings.length > 0 && (
          <div className="mt-4 w-full">
            {warnings.map((warning, index) => (
              <div key={index} className="flex items-center bg-yellow-50/80 backdrop-blur-sm border border-yellow-200/50 text-yellow-700 px-4 py-3 rounded-xl text-sm mb-2 shadow-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="line-clamp-2 font-medium">{warning}</span>
              </div>
            ))}
          </div>
        )}
      </form>
      
      {/* File type information */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center justify-center p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
          <span className="text-sm font-semibold text-gray-700">SVG</span>
          <span className="ml-2 text-xs text-gray-500">Vector</span>
        </div>
        <div className="flex items-center justify-center p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
          <span className="text-sm font-semibold text-gray-700">PNG</span>
          <span className="ml-2 text-xs text-gray-500">Raster</span>
        </div>
        <div className="flex items-center justify-center p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
          <span className="text-sm font-semibold text-gray-700">JPEG</span>
          <span className="ml-2 text-xs text-gray-500">Raster</span>
        </div>
        <div className="flex items-center justify-center p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-200">
          <span className="text-sm font-semibold text-gray-700">CSS</span>
          <span className="ml-2 text-xs text-gray-500">Style</span>
        </div>
      </div>
      
      {/* Touch device hint */}
      {isTouchDevice && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Tap the upload area or use the browse button
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploadComponent;