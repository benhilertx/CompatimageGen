'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ClientPreview, PlatformDetails } from '@/types';

interface PlatformInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformDetails: PlatformDetails;
  preview: ClientPreview;
}

/**
 * Modal component to display detailed platform information about email clients
 */
const PlatformInfoModal: React.FC<PlatformInfoModalProps> = ({
  isOpen,
  onClose,
  platformDetails,
  preview
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Handle keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Close on escape key
      if (event.key === 'Escape') {
        onClose();
      }

      // Trap focus within modal
      if (event.key === 'Tab') {
        // Get all focusable elements in the modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        // If shift+tab and first element is focused, move to last element
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } 
        // If tab and last element is focused, move to first element
        else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when modal opens
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    } else if (previousFocusRef.current) {
      // Return focus to the previously focused element when modal closes
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  // Handle animation end
  const handleAnimationEnd = () => {
    if (!isOpen) {
      setIsAnimating(false);
    }
  };

  // Don't render anything if modal is closed and not animating
  if (!isOpen && !isAnimating) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300 ease-in-out`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="platform-info-title"
      onClick={(e) => {
        // Close when clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black ${
          isOpen ? 'opacity-50' : 'opacity-0'
        } transition-opacity duration-300 ease-in-out`}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden ${
          isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'
        } transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 id="platform-info-title" className="text-xl font-semibold text-gray-800">
            {platformDetails.name}
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full p-1"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body with scrollable content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Market share */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Market Share:</span>
              <span className="text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                {platformDetails.marketShare}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${Math.min(platformDetails.marketShare, 100)}%` }}
                role="progressbar"
                aria-valuenow={platformDetails.marketShare}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Supported Features */}
          <section className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Supported Features</h3>
            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
              {platformDetails.supportedFeatures.map((feature, index) => (
                <li key={`feature-${index}`}>{feature}</li>
              ))}
            </ul>
          </section>

          {/* Limitations */}
          <section className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Limitations</h3>
            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
              {platformDetails.limitations.map((limitation, index) => (
                <li key={`limitation-${index}`}>{limitation}</li>
              ))}
            </ul>
          </section>

          {/* Best Practices */}
          <section className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Best Practices</h3>
            <ul className="space-y-1 text-sm text-gray-600 list-disc list-inside">
              {platformDetails.bestPractices.map((practice, index) => (
                <li key={`practice-${index}`}>{practice}</li>
              ))}
            </ul>
          </section>

          {/* Rendering Notes */}
          <section className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-md font-semibold text-gray-800 mb-2">Rendering Notes for Your Logo</h3>
            <p className="text-sm text-gray-600">{platformDetails.renderingNotes}</p>
            
            {/* Fallback-specific notes */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Fallback Used:</span>
                <span className="text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                  {preview.fallbackUsed === 'svg' ? 'SVG (Vector)' : 
                   preview.fallbackUsed === 'png' ? 'PNG (Raster)' : 
                   preview.fallbackUsed === 'vml' ? 'VML (Outlook Vector)' : 
                   preview.fallbackUsed}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {preview.fallbackUsed === 'svg' && 'Vector format will render at any size with crisp edges.'}
                {preview.fallbackUsed === 'png' && 'Raster format may appear pixelated at larger sizes.'}
                {preview.fallbackUsed === 'vml' && 'VML format has limited support for complex shapes.'}
              </p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-sm"
            style={{ touchAction: "manipulation" }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlatformInfoModal;