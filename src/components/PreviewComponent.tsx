'use client';

import React, { useState, useEffect } from 'react';
import { ClientPreview, EmailClient, EMAIL_CLIENTS, FallbackType, PlatformDetails } from '@/types';
import HTMLPreviewRenderer from './HTMLPreviewRenderer';
import PlatformInfoModal from './PlatformInfoModal';
import PlatformDetailsService from '@/lib/services/platform-details-service';

interface PreviewComponentProps {
  previews: ClientPreview[];
  htmlCode: string;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({ previews, htmlCode }) => {
  const [selectedClient, setSelectedClient] = useState<EmailClient | 'all'>('all');
  const [showCode, setShowCode] = useState<boolean>(false);
  const [selectedPreview, setSelectedPreview] = useState<ClientPreview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedPreviews, setLoadedPreviews] = useState<Set<number>>(new Set());

  // Initialize loading state
  useEffect(() => {
    // Simulate initial loading
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [previews]);

  // Track which previews have been loaded
  const handlePreviewLoaded = (index: number) => {
    setLoadedPreviews(prev => new Set(prev).add(index));
  };

  // Get fallback type display name
  const getFallbackTypeName = (type: FallbackType): string => {
    switch (type) {
      case 'svg':
        return 'SVG (Vector)';
      case 'png':
        return 'PNG (Raster)';
      case 'vml':
        return 'VML (Outlook Vector)';
      default:
        return type;
    }
  };

  // Get quality rating display with color
  const getQualityDisplay = (quality: string): { text: string; color: string } => {
    switch (quality) {
      case 'excellent':
        return { text: 'Excellent', color: 'text-green-600' };
      case 'good':
        return { text: 'Good', color: 'text-emerald-600' };
      case 'fair':
        return { text: 'Fair', color: 'text-amber-600' };
      case 'poor':
        return { text: 'Poor', color: 'text-red-600' };
      default:
        return { text: quality, color: 'text-gray-600' };
    }
  };

  // Get client name from ID
  const getClientName = (clientId: EmailClient): string => {
    const client = EMAIL_CLIENTS.find(c => c.id === clientId);
    return client ? client.name : clientId;
  };

  // Get market share percentage
  const getMarketShare = (clientId: EmailClient): number => {
    const client = EMAIL_CLIENTS.find(c => c.id === clientId);
    return client ? client.marketShare : 0;
  };
  
  // Handle opening the platform info modal
  const handleOpenPlatformInfo = (preview: ClientPreview) => {
    setSelectedPreview(preview);
    setIsModalOpen(true);
  };
  
  // Handle closing the platform info modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Get platform details for the selected preview
  const getPlatformDetails = (preview: ClientPreview): PlatformDetails => {
    return PlatformDetailsService.getPlatformDetails(preview.client);
  };

  // Filter previews based on selected client
  const filteredPreviews = selectedClient === 'all' 
    ? previews 
    : previews.filter(preview => preview.client === selectedClient);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Email Client Previews</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          See how your logo will appear in different email clients
        </p>

        {/* Client selector - improved for mobile */}
        <div className="mb-4 overflow-x-auto pb-2 -mx-1 px-1">
          <div className="flex flex-nowrap gap-2 min-w-max">
            <button
              onClick={() => setSelectedClient('all')}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                selectedClient === 'all'
                  ? 'bg-primary-100 text-primary-800 border border-primary-300 shadow-sm'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ touchAction: "manipulation" }}
              aria-pressed={selectedClient === 'all'}
            >
              All Clients
            </button>
            
            {EMAIL_CLIENTS.filter(client => 
              // Only show clients that are in the previews
              previews.some(preview => preview.client === client.id)
            ).map(client => (
              <button
                key={client.id}
                onClick={() => setSelectedClient(client.id)}
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedClient === client.id
                    ? 'bg-primary-100 text-primary-800 border border-primary-300 shadow-sm'
                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300'
                }`}
                style={{ touchAction: "manipulation" }}
                aria-pressed={selectedClient === client.id}
              >
                {client.name}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle code view */}
        <div className="mb-4">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-md border border-gray-300 transition-all duration-200 flex items-center"
            style={{ touchAction: "manipulation" }}
            aria-expanded={showCode}
            aria-controls="html-code-section"
          >
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">{showCode ? 'Hide HTML Code' : 'Show HTML Code'}</span>
          </button>
        </div>

        {/* HTML Code with smooth transition */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showCode ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div id="html-code-section" className="mb-4 sm:mb-6">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">HTML Code</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(htmlCode);
                  // You could add a toast notification here
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded border border-gray-300 transition-colors"
                style={{ touchAction: "manipulation" }}
                aria-label="Copy HTML code to clipboard"
              >
                Copy to Clipboard
              </button>
            </div>
            <div className="bg-gray-50 rounded-md border border-gray-200 p-3 sm:p-4 overflow-x-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                {htmlCode}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Preview cards with loading state */}
      <div className="p-4 sm:p-6">
        {isLoading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((_, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden animate-pulse">
                <div className="bg-gray-100 p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-1/4"></div>
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <div className="h-40 bg-gray-100 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPreviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No previews available for the selected client
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPreviews.map((preview, index) => {
              const quality = getQualityDisplay(preview.estimatedQuality);
              const isPreviewLoaded = loadedPreviews.has(index);
              
              return (
                <div 
                  key={index} 
                  className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  {/* Client header */}
                  <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h3 className="font-medium text-sm sm:text-base">{getClientName(preview.client)}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {getMarketShare(preview.client)}% market share
                        </span>
                        {/* Info icon with improved focus state */}
                        <button 
                          onClick={() => handleOpenPlatformInfo(preview)}
                          className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-full p-1 transition-colors"
                          aria-label={`Show details for ${getClientName(preview.client)}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview content with loading indicator */}
                  <div className="p-3 sm:p-4">
                    {/* HTML Preview Renderer with loading state */}
                    <div className="relative mb-3 sm:mb-4 border border-gray-100 rounded overflow-hidden bg-gray-50">
                      {preview.htmlPreview && preview.clientStyles ? (
                        <div className="relative">
                          {/* Loading indicator overlay */}
                          <div 
                            className={`absolute inset-0 bg-gray-50 flex justify-center items-center z-10 transition-opacity duration-300 ${
                              isPreviewLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                            }`}
                          >
                            <div className="flex flex-col items-center">
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
                          
                          {/* Actual preview */}
                          <HTMLPreviewRenderer
                            htmlContent={preview.htmlPreview}
                            clientStyles={preview.clientStyles}
                            clientId={preview.client}
                            height="200px"
                            title={`${getClientName(preview.client)} Preview`}
                            onLoad={() => handlePreviewLoaded(index)}
                          />
                        </div>
                      ) : preview.previewImage ? (
                        <div className="flex justify-center bg-white p-2">
                          <img 
                            src={`data:image/png;base64,${preview.previewImage.toString('base64')}`}
                            alt={`${getClientName(preview.client)} preview`}
                            className="max-w-full h-auto"
                            loading="lazy"
                            onLoad={() => handlePreviewLoaded(index)}
                          />
                        </div>
                      ) : (
                        <div className="h-[200px] flex justify-center items-center bg-gray-100 text-gray-500 text-sm">
                          No preview available
                        </div>
                      )}
                    </div>
                    
                    {/* Fallback info with improved layout */}
                    <div className="space-y-2 bg-white rounded-md p-3 border border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Fallback Used:</span>
                        <span className="text-xs sm:text-sm font-medium px-2 py-0.5 bg-gray-100 rounded-full">
                          {getFallbackTypeName(preview.fallbackUsed)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Rendering Quality:</span>
                        <span className={`text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full ${
                          quality.color === 'text-green-600' ? 'bg-green-100 text-green-800' :
                          quality.color === 'text-emerald-600' ? 'bg-emerald-100 text-emerald-800' :
                          quality.color === 'text-amber-600' ? 'bg-amber-100 text-amber-800' :
                          quality.color === 'text-red-600' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {quality.text}
                        </span>
                      </div>
                      
                      {/* Client-specific notes */}
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100">
                        <h4 className="text-xs font-medium text-gray-700 mb-1">Notes:</h4>
                        <ul className="text-xs text-gray-600 list-disc list-inside">
                          {preview.fallbackUsed === 'svg' && (
                            <li>Vector format will render at any size with crisp edges</li>
                          )}
                          {preview.fallbackUsed === 'png' && (
                            <li>Raster format may appear pixelated at larger sizes</li>
                          )}
                          {preview.fallbackUsed === 'vml' && (
                            <li>VML format has limited support for complex shapes</li>
                          )}
                          {preview.client === 'outlook-desktop' && (
                            <li>Outlook Desktop has limited CSS support</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Platform Info Modal */}
      {selectedPreview && (
        <PlatformInfoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          platformDetails={getPlatformDetails(selectedPreview)}
          preview={selectedPreview}
        />
      )}
    </div>
  );
};

export default PreviewComponent;