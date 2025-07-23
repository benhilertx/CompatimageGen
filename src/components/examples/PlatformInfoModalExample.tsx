'use client';

import React, { useState } from 'react';
import PlatformInfoModal from '../PlatformInfoModal';
import { ClientPreview, EmailClient, FallbackType, PlatformDetails } from '@/types';
import PlatformDetailsService from '@/lib/services/platform-details-service';

/**
 * Example component demonstrating the usage of PlatformInfoModal
 */
const PlatformInfoModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EmailClient>('gmail');

  // Sample preview data
  const samplePreview: ClientPreview = {
    client: selectedClient,
    fallbackUsed: selectedClient === 'apple-mail' ? 'svg' : 
                  selectedClient === 'outlook-desktop' ? 'vml' : 'png',
    estimatedQuality: 'good',
    htmlPreview: '<div>Sample HTML Preview</div>',
    clientStyles: '.sample { color: blue; }'
  };

  // Get platform details from service
  const platformDetails: PlatformDetails = PlatformDetailsService.getPlatformDetails(selectedClient);

  const handleOpenModal = (client: EmailClient) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Platform Info Modal Example</h2>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleOpenModal('gmail')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open Gmail Info
        </button>
        
        <button
          onClick={() => handleOpenModal('apple-mail')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open Apple Mail Info
        </button>
        
        <button
          onClick={() => handleOpenModal('outlook-desktop')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Open Outlook Desktop Info
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <p>Click any of the buttons above to open the platform info modal.</p>
        <p className="mt-2 text-sm text-gray-600">
          The modal will display detailed information about the selected email client platform,
          including supported features, limitations, best practices, and rendering notes.
        </p>
      </div>
      
      {/* Platform Info Modal */}
      <PlatformInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        platformDetails={platformDetails}
        preview={samplePreview}
      />
    </div>
  );
};

export default PlatformInfoModalExample;