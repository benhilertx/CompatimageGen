import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FileError, ProcessingError, NetworkError } from '../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary component for graceful error handling in React components
 * Catches JavaScript errors in child component tree and displays fallback UI
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to monitoring service
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  /**
   * Get user-friendly error message based on error type
   */
  getUserFriendlyMessage(error: Error): string {
    // Check if error is one of our custom error types
    if ('code' in error) {
      const typedError = error as FileError | ProcessingError | NetworkError;
      
      switch (typedError.code) {
        // File errors
        case 'file-too-large':
          return 'The file you uploaded is too large. Please upload a file smaller than 1MB.';
        case 'invalid-file-type':
          return 'This file type is not supported. Please upload an SVG, PNG, JPEG, or CSS file.';
        case 'corrupted-file':
          return 'The file appears to be corrupted. Please try uploading a different file.';
        case 'invalid-svg-structure':
          return 'The SVG file has an invalid structure. Please check the file and try again.';
        
        // Processing errors
        case 'optimization-failed':
          return 'We couldn\'t optimize your file. Try simplifying your image or using a different format.';
        case 'conversion-failed':
          return 'File conversion failed. Try uploading a simpler image or a different format.';
        case 'vml-generation-failed':
          return 'VML generation for Outlook compatibility failed. Your image may be too complex for VML conversion.';
        case 'html-generation-failed':
          return 'HTML code generation failed. Please try again with a different file.';
        
        // Network errors
        case 'upload-failed':
          return 'File upload failed. Please check your connection and try again.';
        case 'download-failed':
          return 'Download failed. Please try again or refresh the page.';
        case 'connection-lost':
          return 'Connection to the server was lost. Please check your internet connection and try again.';
        
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }
    
    // Generic error message for unknown errors
    return 'Something went wrong. Please try again or refresh the page.';
  }

  /**
   * Get actionable suggestion based on error type
   */
  getActionableSuggestion(error: Error): string {
    if ('code' in error) {
      const typedError = error as FileError | ProcessingError | NetworkError;
      
      switch (typedError.code) {
        // File errors
        case 'file-too-large':
          return 'Try compressing your image before uploading or use a simpler version of your logo.';
        case 'invalid-file-type':
          return 'Convert your file to SVG, PNG, JPEG, or CSS format using an image editor.';
        case 'corrupted-file':
          return 'Try re-exporting the file from your design software or use a different file.';
        case 'invalid-svg-structure':
          return 'Open your SVG in a text editor or vector graphics program to fix any structural issues.';
        
        // Processing errors
        case 'optimization-failed':
          return 'Try simplifying your image by removing complex effects, gradients, or animations.';
        case 'conversion-failed':
          return 'Use a simpler version of your logo or try a different file format.';
        case 'vml-generation-failed':
          return 'Consider using a simpler logo for better Outlook compatibility or rely on the PNG fallback.';
        case 'html-generation-failed':
          return 'Try uploading a different version of your logo or contact support if the issue persists.';
        
        // Network errors
        case 'upload-failed':
          return 'Check your internet connection, wait a moment, and try uploading again.';
        case 'download-failed':
          return 'Refresh the page and try downloading again. If the issue persists, try a different browser.';
        case 'connection-lost':
          return 'Reconnect to the internet and refresh the page to try again.';
        
        default:
          return 'Try refreshing the page or uploading a different file.';
      }
    }
    
    return 'Try refreshing the page or uploading a different file.';
  }

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      // Default error UI if no fallback provided
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-red-600 mb-4">{this.getUserFriendlyMessage(error)}</p>
          <div className="bg-white p-4 rounded border border-red-100 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Suggestion:</h3>
            <p className="text-sm text-gray-600">{this.getActionableSuggestion(error)}</p>
          </div>
          <button
            onClick={this.resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary;