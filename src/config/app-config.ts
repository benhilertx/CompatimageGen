/**
 * Application configuration
 */

export const APP_CONFIG = {
  // File upload constraints
  upload: {
    maxFileSize: 1024 * 1024, // 1MB in bytes
    acceptedFileTypes: {
      svg: ['image/svg+xml'],
      png: ['image/png'],
      jpeg: ['image/jpeg', 'image/jpg'],
      css: ['text/css']
    },
    tempDir: '/tmp/uploads' // Directory for temporary file storage
  },
  
  // Processing options
  processing: {
    // SVG optimization options for SVGO
    svgoOptions: {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDimensions',
        {
          name: 'removeViewBox',
          active: false
        },
        {
          name: 'cleanupIDs',
          params: {
            prefix: {
              toString() {
                return `logo-${Math.random().toString(36).substr(2, 9)}`;
              }
            }
          }
        }
      ]
    },
    
    // Image processing options for Sharp
    imageOptions: {
      png: {
        quality: 90,
        compressionLevel: 9,
        adaptiveFiltering: true
      },
      jpeg: {
        quality: 85,
        progressive: true
      }
    },
    
    // Default dimensions if not specified
    defaultDimensions: {
      width: 200,
      height: 200
    }
  },
  
  // Email client preview settings
  previews: {
    // Generate previews for these clients
    clients: ['apple-mail', 'gmail', 'outlook-desktop'],
    
    // Preview image dimensions
    dimensions: {
      width: 300,
      height: 200
    }
  },
  
  // Output settings
  output: {
    // ZIP file settings
    zip: {
      filename: 'email-logo-package.zip',
      compression: 9
    },
    
    // HTML output settings
    html: {
      indentation: 2,
      includeComments: true
    }
  }
};

// Export default config
export default APP_CONFIG;