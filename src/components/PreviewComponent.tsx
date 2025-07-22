'use client';

import React, { useState } from 'react';
import { ClientPreview, EmailClient, EMAIL_CLIENTS, FallbackType } from '@/types';

interface PreviewComponentProps {
  previews: ClientPreview[];
  htmlCode: string;
}

const PreviewComponent: React.FC<PreviewComponentProps> = ({ previews, htmlCode }) => {
  const [selectedClient, setSelectedClient] = useState<EmailClient | 'all'>('all');
  const [showCode, setShowCode] = useState<boolean>(false);

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

  // Filter previews based on selected client
  const filteredPreviews = selectedClient === 'all' 
    ? previews 
    : previews.filter(preview => preview.client === selectedClient);

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h2 className="text-lg sm:text-xl font-semibold mb-2">Email Client Previews</h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4">
          See how your logo will appear in different email clients
        </p>

        {/* Client selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedClient('all')}
            className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              selectedClient === 'all'
                ? 'bg-primary-100 text-primary-800 border border-primary-300'
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
              className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                selectedClient === client.id
                  ? 'bg-primary-100 text-primary-800 border border-primary-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ touchAction: "manipulation" }}
              aria-pressed={selectedClient === client.id}
            >
              {client.name}
            </button>
          ))}
        </div>

        {/* Toggle code view */}
        <div className="mb-4">
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 rounded-md border border-gray-300 transition-colors flex items-center"
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

        {/* HTML Code */}
        {showCode && (
          <div id="html-code-section" className="mb-4 sm:mb-6">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-gray-700">HTML Code</h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(htmlCode);
                  // You could add a toast notification here
                }}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700 rounded border border-gray-300"
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
        )}
      </div>

      {/* Preview cards */}
      <div className="p-4 sm:p-6">
        {filteredPreviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No previews available for the selected client
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPreviews.map((preview, index) => {
              const quality = getQualityDisplay(preview.estimatedQuality);
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Client header */}
                  <div className="bg-gray-50 p-3 sm:p-4 border-b border-gray-200">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h3 className="font-medium text-sm sm:text-base">{getClientName(preview.client)}</h3>
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {getMarketShare(preview.client)}% market share
                      </span>
                    </div>
                  </div>
                  
                  {/* Preview content */}
                  <div className="p-3 sm:p-4">
                    {/* If we have a preview image (base64 string) */}
                    {preview.previewImage && (
                      <div className="mb-3 sm:mb-4 flex justify-center bg-white border border-gray-100 rounded p-2">
                        <img 
                          src={`data:image/png;base64,${preview.previewImage.toString('base64')}`}
                          alt={`${getClientName(preview.client)} preview`}
                          className="max-w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    {/* Fallback info */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Fallback Used:</span>
                        <span className="text-xs sm:text-sm font-medium">{getFallbackTypeName(preview.fallbackUsed)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Rendering Quality:</span>
                        <span className={`text-xs sm:text-sm font-medium ${quality.color}`}>{quality.text}</span>
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
    </div>
  );
};

export default PreviewComponent;