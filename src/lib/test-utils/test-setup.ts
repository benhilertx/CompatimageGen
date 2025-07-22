import { vi } from 'vitest';
import { FileType } from '@/types';

/**
 * Test utilities for file processing tests
 */

/**
 * Create a mock file with specified properties
 * @param options File options
 * @returns Mock File object
 */
export function createMockFile({
  name = 'test.svg',
  type = 'image/svg+xml',
  size = 1000,
  content = '<svg></svg>'
}: {
  name?: string;
  type?: string;
  size?: number;
  content?: string;
} = {}): File {
  const blob = new Blob([content], { type });
  return new File([blob], name, { type });
}

/**
 * Create a mock buffer with specified content
 * @param content Content for the buffer
 * @returns Buffer
 */
export function createMockBuffer(content: string | Buffer): Buffer {
  if (typeof content === 'string') {
    return Buffer.from(content);
  }
  return content;
}

/**
 * Create a mock file data object
 * @param options File data options
 * @returns Mock file data object
 */
export function createMockFileData({
  buffer = Buffer.from('<svg></svg>'),
  originalName = 'test.svg',
  mimeType = 'image/svg+xml',
  size = 1000,
  fileType = 'svg' as FileType
} = {}) {
  return {
    buffer,
    originalName,
    mimeType,
    size,
    fileType
  };
}

/**
 * Sample SVG strings for testing
 */
export const testSvgs = {
  simple: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="red" /></svg>',
  complex: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:rgb(255,255,0);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgb(255,0,0);stop-opacity:1" />
        </linearGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="40" fill="url(#grad1)" filter="url(#blur)" />
      <animate attributeName="r" begin="0s" dur="1s" repeatCount="indefinite" from="40" to="45" />
    </svg>
  `,
  malicious: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <script>alert('XSS');</script>
      <circle cx="50" cy="50" r="40" fill="red" onclick="alert('clicked')" />
    </svg>
  `,
  invalid: '<svg>Invalid</svg'
};

/**
 * Mock FormData for testing file uploads
 */
export class MockFormData {
  private data: Map<string, any> = new Map();

  append(key: string, value: any): void {
    this.data.set(key, value);
  }

  get(key: string): any {
    return this.data.get(key);
  }

  has(key: string): boolean {
    return this.data.has(key);
  }
}

/**
 * Mock Response for testing API routes
 */
export class MockResponse {
  statusCode: number = 200;
  headers: Map<string, string> = new Map();
  body: any = null;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.body = data;
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name, value);
    return this;
  }
}

/**
 * Mock sharp for testing image processing
 */
export const mockSharp = () => {
  const mockInstance = {
    resize: vi.fn().mockReturnThis(),
    png: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
    metadata: vi.fn().mockResolvedValue({ width: 100, height: 100 })
  };

  const mockSharpFn = vi.fn().mockImplementation(() => mockInstance);
  
  return { mockSharpFn, mockInstance };
};

/**
 * Mock SVGO for testing SVG processing
 */
export const mockSvgo = () => {
  return {
    optimize: vi.fn().mockImplementation((svg) => ({
      data: svg.replace(/\s+/g, ' ').trim()
    }))
  };
};

/**
 * Mock JSZip for testing package generation
 */
export const mockJsZip = () => {
  const mockFolder = {
    file: vi.fn()
  };

  const mockZip = {
    file: vi.fn(),
    folder: vi.fn().mockReturnValue(mockFolder),
    generateAsync: vi.fn().mockResolvedValue(Buffer.from('mock-zip-data'))
  };

  const MockJSZip = vi.fn().mockImplementation(() => mockZip);
  
  return { MockJSZip, mockZip, mockFolder };
};