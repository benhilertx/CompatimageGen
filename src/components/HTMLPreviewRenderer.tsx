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
            zIndex: 1
          }}
        >
          <div className="loading-spinner" aria-label="Loading preview">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              <circle 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="#ccc" 
                strokeWidth="4" 
                fill="none" 
                strokeDasharray="30 30"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {hasError && (
        <div 
          className="error-message"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff0f0',
            padding: '1rem',
            color: '#d32f2f',
            zIndex: 1
          }}
        >
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ marginBottom: '0.5rem' }}
          >
            <path 
              d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" 
              fill="#d32f2f"
            />
            <path 
              d="M12 14C11.4477 14 11 13.5523 11 13V8C11 7.44772 11.4477 7 12 7C12.5523 7 13 7.44772 13 8V13C13 13.5523 12.5523 14 12 14Z" 
              fill="#d32f2f"
            />
            <path 
              d="M12 17C11.4477 17 11 16.5523 11 16C11 15.4477 11.4477 15 12 15C12.5523 15 13 15.4477 13 16C13 16.5523 12.5523 17 12 17Z" 
              fill="#d32f2f"
            />
          </svg>
          <p style={{ margin: 0, textAlign: 'center' }}>
            Unable to render preview
          </p>
        </div>
      )}
      
      {/* Sandboxed iframe for rendering HTML content */}
      <iframe
        ref={iframeRef}
        title={title}
        sandbox="allow-same-origin"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          backgroundColor: 'transparent',
          opacity: isLoaded && !hasError ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
        aria-label={`${title} for ${clientId}`}
      />
    </div>
  );
};

export default HTMLPreviewRenderer;