/**
 * Core data types for CompatimageGen
 */

// File types supported by the application
export type FileType = 'svg' | 'png' | 'jpeg' | 'css';

// Email client types
export type EmailClient = 'apple-mail' | 'gmail' | 'outlook-desktop' | 'outlook-web' | 'yahoo' | 'thunderbird' | 'samsung-mail' | 'other';

// Fallback types for different email clients
export type FallbackType = 'svg' | 'png' | 'vml';

// Quality rating for preview estimates
export type QualityRating = 'excellent' | 'good' | 'fair' | 'poor';

// File data structure
export interface FileData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  fileType: FileType;
}

// Validation result for uploaded files
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Processing options for file conversion
export interface ProcessingOptions {
  altText: string;
  dimensions?: {
    width: number;
    height: number;
  };
  optimizationLevel?: 'low' | 'medium' | 'high';
  generatePreviews: boolean;
}

// Warning message structure
export interface Warning {
  type: 'svg-complexity' | 'file-size' | 'css-compatibility' | 'vml-conversion';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Processing status information
export interface ProcessingStatus {
  step: 'validating' | 'optimizing' | 'generating-fallbacks' | 'creating-html' | 'packaging' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

// Processing metadata
export interface ProcessingMetadata {
  originalFileSize: number;
  optimizedFileSize: number;
  compressionRatio: number;
  processingTime: number;
  generatedAt: string;
}

// Result of file processing
export interface ProcessingResult {
  originalFile: FileData;
  optimizedSvg?: string;
  pngFallback: Buffer;
  vmlCode?: string;
  base64DataUri: string;
  htmlSnippet: string;
  warnings: Warning[];
  metadata: ProcessingMetadata;
}

// Fallback data for HTML generation
export interface FallbackData {
  svgContent?: string;
  pngBase64: string;
  vmlCode?: string;
  dimensions: { width: number; height: number };
  altText: string;
}

// Email client preview information
export interface ClientPreview {
  client: EmailClient;
  fallbackUsed: FallbackType;
  estimatedQuality: QualityRating;
  previewImage?: Buffer;
}

// Package data for ZIP generation
export interface PackageData {
  htmlSnippet: string;
  pngFile: Buffer;
  instructions: string;
  previews: ClientPreview[];
  metadata: ProcessingMetadata;
}

// Email client configuration
export interface EmailClientConfig {
  name: string;
  id: EmailClient;
  marketShare: number;
  supportsSvg: boolean;
  supportsVml: boolean;
  cssLimitations: string[];
  preferredFallback: FallbackType;
}

// Email client configurations
export const EMAIL_CLIENTS: EmailClientConfig[] = [
  {
    name: 'Apple Mail',
    id: 'apple-mail',
    marketShare: 55,
    supportsSvg: true,
    supportsVml: false,
    cssLimitations: ['animations', 'filters'],
    preferredFallback: 'svg'
  },
  {
    name: 'Gmail',
    id: 'gmail',
    marketShare: 29,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'head-css'],
    preferredFallback: 'png'
  },
  {
    name: 'Outlook Desktop',
    id: 'outlook-desktop',
    marketShare: 6,
    supportsSvg: false,
    supportsVml: true,
    cssLimitations: ['border-radius', 'flexbox'],
    preferredFallback: 'vml'
  },
  {
    name: 'Outlook Web',
    id: 'outlook-web',
    marketShare: 1,
    supportsSvg: false,
    supportsVml: true,
    cssLimitations: ['border-radius', 'flexbox'],
    preferredFallback: 'vml'
  },
  {
    name: 'Yahoo Mail',
    id: 'yahoo',
    marketShare: 3,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'advanced-selectors'],
    preferredFallback: 'png'
  },
  {
    name: 'Thunderbird',
    id: 'thunderbird',
    marketShare: 0.5,
    supportsSvg: true,
    supportsVml: false,
    cssLimitations: [],
    preferredFallback: 'svg'
  },
  {
    name: 'Samsung Mail',
    id: 'samsung-mail',
    marketShare: 0.5,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'advanced-selectors'],
    preferredFallback: 'png'
  },
  {
    name: 'Other Clients',
    id: 'other',
    marketShare: 5,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'advanced-selectors'],
    preferredFallback: 'png'
  }
];

// Error types
export interface FileError {
  code: 'file-too-large' | 'invalid-file-type' | 'corrupted-file' | 'invalid-svg-structure';
  message: string;
  details?: string;
}

export interface ProcessingError {
  code: 'optimization-failed' | 'conversion-failed' | 'vml-generation-failed' | 'html-generation-failed';
  message: string;
  details?: string;
}

export interface NetworkError {
  code: 'upload-failed' | 'download-failed' | 'connection-lost';
  message: string;
  details?: string;
}