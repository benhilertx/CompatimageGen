import { EmailClientConfig } from '@/types'

export const EMAIL_CLIENTS: EmailClientConfig[] = [
  {
    name: 'Apple Mail',
    marketShare: 55,
    supportsSvg: true,
    supportsVml: false,
    cssLimitations: ['animations', 'filters'],
    preferredFallback: 'svg'
  },
  {
    name: 'Gmail',
    marketShare: 29,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'head-css', 'flexbox'],
    preferredFallback: 'png'
  },
  {
    name: 'Outlook Desktop',
    marketShare: 6,
    supportsSvg: false,
    supportsVml: true,
    cssLimitations: ['border-radius', 'flexbox', 'transforms'],
    preferredFallback: 'vml'
  },
  {
    name: 'Outlook Web',
    marketShare: 1,
    supportsSvg: false,
    supportsVml: true,
    cssLimitations: ['border-radius', 'flexbox'],
    preferredFallback: 'vml'
  },
  {
    name: 'Yahoo Mail',
    marketShare: 3,
    supportsSvg: false,
    supportsVml: false,
    cssLimitations: ['position', 'some-css-properties'],
    preferredFallback: 'png'
  },
  {
    name: 'Thunderbird',
    marketShare: 0.5,
    supportsSvg: true,
    supportsVml: false,
    cssLimitations: ['inconsistent-css'],
    preferredFallback: 'svg'
  }
]

export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 1024 * 1024, // 1MB
  ACCEPTED_TYPES: ['image/svg+xml', 'image/png', 'image/jpeg', 'text/css'],
  ACCEPTED_EXTENSIONS: ['.svg', '.png', '.jpg', '.jpeg', '.css']
}

export const PROCESSING_DEFAULTS = {
  MAX_WIDTH: 600,
  MAX_HEIGHT: 400,
  PNG_QUALITY: 90,
  TIMEOUT_MS: 30000
}