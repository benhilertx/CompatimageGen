'use client';

import React, { useRef, useEffect, useState } from 'react';
import { EmailClient } from '@/types';

interface HTMLPreviewRendererProps {
  htmlContent: string;
  clientStyles: string;
  clientId: EmailClient;
  width?: number | string;
  height?: number | string;
  title?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Component for rendering HTML previews with client-specific styling in a sandboxed environment
 */
const HTMLPreviewRenderer: React.FC<HTMLPreviewRendererProps> = ({
  htmlContent,
  clientStyles,
  clientId,
  width = '100%',
  height = '300px',
  title = 'Email Preview',
  onLoad,
  onError
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Create a complete HTML document with the content and styles
  const getFullHtmlDocument = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      height: 100%;
      overflow: hidden;
    }
    body {
      font-family: sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .email-preview-container {
      max-width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    ${clientStyles}
  </style>
</head>
<body>
  <div class="email-preview-container">
    ${htmlContent}
  </div>
</body>
</html>`;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      // Set up iframe content
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDocument) {
        // Write the HTML content to the iframe
        iframeDocument.open();
        iframeDocument.write(getFullHtmlDocument());
        iframeDocument.close();
        
        // Handle iframe load event
        const handleLoad = () => {
          setIsLoaded(true);
          setHasError(false);
          if (onLoad) onLoad();
        };
        
        iframe.onload = handleLoad;
        
        // If the iframe is already loaded (happens in some browsers)
        if (iframeDocument.readyState === 'complete') {
          handleLoad();
        }
      }
    } catch (error) {
      console.error('Error rendering HTML preview:', error);
      setHasError(true);
      setIsLoaded(false);
      if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [htmlContent, clientStyles, clientId, onLoad, onError]);

  return (
    <div 
      className="html-preview-renderer"
      style={{ 
        width, 
        height, 
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      }}
      data-testid={`html-preview-${clientId}`}
    >
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div 
          className="loading-indicator"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f9f9f9',
            zIndex: 1,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <div className="loading-spinner flex flex-col items-center" aria-label="Loading preview">
            <svg 
              className="animate-spin h-8 w-8 text-primary-500 mb-2" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-xs text-gray-500">Loading preview...</span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <div 
          className="error-message bg-red-50 text-red-600 absolute inset-0 flex flex-col justify-center items-center p-4 z-10 transition-all duration-300"
        >
          <svg 
            className="w-8 h-8 mb-2"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-center text-sm font-medium">
            Unable to render preview
          </p>
          <p className="text-center text-xs mt-1">
            The email client may not support this content
          </p>
        </div>
      )}
      
      {/* Sandboxed iframe for rendering HTML content */}
      <iframe
        ref={iframeRef}
        title={title}
        sandbox="allow-same-origin"
        className="w-full h-full border-none bg-transparent transition-opacity duration-300 ease-in-out"
        style={{
          opacity: isLoaded && !hasError ? 1 : 0,
        }}
        aria-label={`${title} for ${clientId}`}
        onLoad={() => {
          setIsLoaded(true);
          if (onLoad) onLoad();
        }}
      />
    </div>
  );
};

export default HTMLPreviewRenderer;