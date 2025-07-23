'use client';

import React, { useState } from 'react';
import HTMLPreviewRenderer from '../HTMLPreviewRenderer';
import { EmailClient, EMAIL_CLIENTS } from '@/types';

/**
 * Example component demonstrating the usage of HTMLPreviewRenderer
 */
const HTMLPreviewExample: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<EmailClient>('gmail');
  
  // Sample HTML content for demonstration
  const sampleHtmlContent = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center">
          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAFJElEQVR4nO2dW4hVVRjHf2fGcZwZL5lkZmqWlaRGD0EPUWJFUBBFdKGHoKAegh6KoqKXLg9BQa9FD0FBQRQVXYioKMHoYhJlZRdNMzXNGW/jzMzp4ZwTh3HO2Wuds/bea+/v94Kw9tprfev/n73X2t/6LiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoiiKoihKFdSiNqAkU4EFwHxgFjATmAFMBCYBY4FxQA8wCAwAR4F+4CBwANgH7AZ2AtuBnRHYXzlTgOXAGuBbYBjoLVkGgC3A28AyYHwVHYmJGcBLwCbgNPYCKFOGgI3Ai8D0CvoVJNOAF4CdVCeEqbIDeB6YWnYHQ2Aq8CSwl+qFMFX2AE8AU0rsbxDMAzYQhhCmygZgbsn9jsJ84CPgBHEJYaqcAD4E5pTY/8qYDLxJvEKYKkPAG8CEEuOonE7gNeAY8QthqhwFXgU6SoqlMmrAKmA/8QthquwDVhJZHtMBPAMcJn4hTJXDwNNElsd0Ac8BR4hfCFPlCPAskeQxncAzwH7iF8JU2Qc8TQR5TBfwPHCI+IUwVQ4CTxFwHtMFvEQYeUgZZYiA85gxwMuEk4eUUQaAl4CxBcfpmQ7gFcLKQ8ooR4AXCSSPGQu8Rlh5SBnlOPAqgeQxXcDrhJWHlFEGgNcJJI/pBN4grDykjHIceIOA8pgO4E3CykPKKCeAtwgkj6kBbxNWHlJGOQm8QyB5TA14l7DykDLKEPAegeQxNeA9wspDyijDwPsEksfUgA8IKw8po5wCPiSQPKYGfERYeUgZ5TTwMYHkMTXgE8LKQ8ooZ4BPCSCPqQGfEVYeUkY5C3xOAHlMDfiCsPKQMso54EsCyGNqwFeElYeUUc4DXxNAHlMDviGsPKSMMgh8SwB5TA34jrDykDLKEPADAeQxNeBHwspDyijDwE8EkMfUgJ8JKw8po4wAvxBAHlMDfiWsPKSMMgr8RgB5TA34nbDykDLKKPAHAeQxNWAzYeUhZZRRYAsB5DE1YCth5SFllBFgGwHkMTVgO2HlIWWUEWAHAeQxNWAnYeUhZZRhYBcB5DE1YDdh5SFllGFgDwHkMTVgL2HlIWWUYWAfAeQxNWA/YeUhZZQh4AAB5DE14CBh5SFllCHgEAHkMTXgMGHlIWWUIeAIAeQxNeAoYeUhZZRB4BgB5DE14Dhh5SFllEHgBAHkMTXgJGHlIWWUQeAUAeQxNeA0YeUhZZQB4AwB5DE14Cxh5SFllAHgHAHkMTXgPGHlIWWU88AFAshjasAFwspDyijngYsEkMfUgIuElYeUUc4BlwggjxkDXCasPKSMcga4QgB5TAdwhbDykDLKaeAqAeQxHcBVwspDyiingGsEkMd0ANcIKw8po5wErhNAHtMBXCesPKSMcgK4QQB5TAdwg7DykDLKceAmAeQxHcBNwspDyihHgVsEkMd0ALcIKw8poxwGbhNAHtMB3CasPKSMcgi4QwB5TAdwh7DykDLKQeAuAeQxHcBdwspDyigHgHsEkMd0APcIKw8po+wH7hNAHtMB3CesPKSMsg94QAB5TAfwgLDykDLKXuAhAeQxHcBDwspDyih7gEcEkMd0AI8IKw8po+wGHhNAHtMBPCasPKSMsgt4QgB5TAfwhLDykDLKTmAFAeQxHcAKwspDyig7gJUEkMd0ACsJKw8po2wHVhFAHtMBrCKsPKSMsg1YTcXCKPNFnVXzGLAYWAQsBBYA84DZwCxgJjCdv9/UGQeMB7qBHmAQGAD6gaPAEeAgsB/YA+wGdgF/ltgGRVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVEURVGU/5W/AH9ZBMVMH+4gAAAAAElFTkSuQmCC" alt="Sample Logo" style="display: block; width: 100px; height: auto;" />
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 20px 0; font-family: Arial, sans-serif; font-size: 16px; color: #333333;">
          <h2>Email Preview Example</h2>
          <p>This is a sample email content to demonstrate the HTML preview renderer.</p>
        </td>
      </tr>
    </table>
  `;
  
  // Get client-specific styles from the selected client
  const getClientStyles = (clientId: EmailClient): string => {
    // Base styles for all email previews
    const baseStyles = `
      .email-preview {
        font-family: sans-serif;
        border-radius: 4px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    `;
    
    // Client-specific styles
    switch (clientId) {
      case 'outlook-desktop':
        return `${baseStyles}
          /* Outlook Desktop limitations */
          body {
            font-family: 'Calibri', sans-serif !important;
          }
          * {
            border-radius: 0 !important;
            box-shadow: none !important;
          }
        `;
        
      case 'gmail':
        return `${baseStyles}
          /* Gmail limitations */
          body {
            font-family: 'Arial', sans-serif !important;
          }
          [style*="position:"] {
            position: static !important;
          }
        `;
        
      case 'apple-mail':
        return `${baseStyles}
          /* Apple Mail - modern support */
          body {
            font-family: 'SF Pro', 'Helvetica Neue', sans-serif !important;
          }
        `;
        
      default:
        return baseStyles;
    }
  };
  
  return (
    <div className="html-preview-example p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">HTML Preview Example</h2>
      
      {/* Client selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Email Client:
        </label>
        <div className="flex flex-wrap gap-2">
          {EMAIL_CLIENTS.slice(0, 3).map(client => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedClient === client.id
                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              {client.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Preview renderer */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-3 border-b border-gray-200">
          <h3 className="font-medium text-sm">
            {EMAIL_CLIENTS.find(c => c.id === selectedClient)?.name || selectedClient} Preview
          </h3>
        </div>
        <div className="p-4">
          <HTMLPreviewRenderer
            htmlContent={sampleHtmlContent}
            clientStyles={getClientStyles(selectedClient)}
            clientId={selectedClient}
            height="300px"
            title={`${EMAIL_CLIENTS.find(c => c.id === selectedClient)?.name || selectedClient} Preview`}
          />
        </div>
      </div>
      
      {/* Description */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          This example demonstrates the HTMLPreviewRenderer component rendering HTML email content
          with client-specific styling. The preview is rendered in a sandboxed iframe for security.
        </p>
      </div>
    </div>
  );
};

export default HTMLPreviewExample;