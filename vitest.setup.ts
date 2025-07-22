// Global test setup
import { expect, vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the console.error to avoid cluttering test output
vi.spyOn(console, 'error').mockImplementation(() => {});

// Mock the fs promises API
vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('mock-file-content')),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue(['file1', 'file2']),
  stat: vi.fn().mockResolvedValue({
    mtimeMs: Date.now() - 1000 * 60 * 60 // 1 hour ago
  }),
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined)
}));

// Mock the path module
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
  resolve: vi.fn((...args) => args.join('/')),
  dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
  basename: vi.fn((p) => p.split('/').pop())
}));

// Mock the os module
vi.mock('os', () => ({
  tmpdir: vi.fn(() => '/tmp')
}));

// Add custom matchers if needed
expect.extend({
  toBeValidSvg(received) {
    const pass = typeof received === 'string' && 
                received.includes('<svg') && 
                received.includes('</svg>');
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid SVG`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid SVG`,
        pass: false
      };
    }
  }
});