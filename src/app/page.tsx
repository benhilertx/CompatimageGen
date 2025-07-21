import React from 'react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">CompatimageGen</h1>
        <p className="text-xl mb-8 text-center">
          Generate email-compatible logo HTML with fallbacks for all major email clients
        </p>
        
        {/* Placeholder for FileUploadComponent */}
        <div className="w-full max-w-2xl mx-auto border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500">
            Drag and drop your logo file here, or click to browse
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Supports SVG, PNG, JPEG, and CSS files (max 1MB)
          </p>
        </div>
        
        {/* Features section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Universal Compatibility</h3>
            <p className="text-gray-600">
              Works across all major email clients including Gmail, Outlook, and Apple Mail
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">No Hosting Required</h3>
            <p className="text-gray-600">
              All assets are embedded as inline data URIs or included in the download package
            </p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Multiple Format Support</h3>
            <p className="text-gray-600">
              Upload SVG, PNG, JPEG, or CSS logos and get optimized outputs with fallbacks
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}