import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileCleanup } from '../file-cleanup';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { APP_CONFIG } from '@/config/app-config';

// Mock fs promises
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
    stat: vi.fn()
  }
}));

describe('FileCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('cleanupFile', () => {
    it('should delete files with matching fileId prefix', async () => {
      const fileId = 'test-file-123';
      const matchingFiles = [
        'test-file-123-original.svg',
        'test-file-123-optimized.svg'
      ];
      
      // Mock readdir to return matching files
      (fs.readdir as any).mockResolvedValueOnce([
        ...matchingFiles,
        'other-file-456.svg'
      ]);
      
      // Mock unlink to succeed
      (fs.unlink as any).mockResolvedValue(undefined);
      
      const result = await FileCleanup.cleanupFile(fileId);
      
      // Check that readdir was called
      expect(fs.readdir).toHaveBeenCalled();
      
      // Check that unlink was called for each matching file
      expect(fs.unlink).toHaveBeenCalledTimes(matchingFiles.length);
      
      // Check that result is true
      expect(result).toBe(true);
    });

    it('should return false if no matching files are found', async () => {
      const fileId = 'test-file-123';
      
      // Mock readdir to return no matching files
      (fs.readdir as any).mockResolvedValueOnce([
        'other-file-456.svg'
      ]);
      
      const result = await FileCleanup.cleanupFile(fileId);
      
      // Check that readdir was called
      expect(fs.readdir).toHaveBeenCalled();
      
      // Check that unlink was not called
      expect(fs.unlink).not.toHaveBeenCalled();
      
      // Check that result is false
      expect(result).toBe(false);
    });
  });

  describe('cleanupExpiredFiles', () => {
    it('should delete files older than maxAgeMs', async () => {
      const now = Date.now();
      const maxAgeMs = 3600000; // 1 hour
      
      const files = [
        'file1.svg',
        'file2.png'
      ];
      
      // Mock readdir to return files
      (fs.readdir as any).mockResolvedValueOnce(files);
      
      // Mock access to succeed
      (fs.access as any).mockResolvedValue(undefined);
      
      // Mock stat to return different mtimes
      (fs.stat as any)
        .mockResolvedValueOnce({ mtimeMs: now - maxAgeMs - 1000 }) // Older than maxAge
        .mockResolvedValueOnce({ mtimeMs: now - 1000 }); // Newer than maxAge
      
      // Mock unlink to succeed
      (fs.unlink as any).mockResolvedValue(undefined);
      
      const result = await FileCleanup.cleanupExpiredFiles(maxAgeMs);
      
      // Check that stat was called for each file
      expect(fs.stat).toHaveBeenCalledTimes(files.length);
      
      // Check that unlink was called only for expired files (1 of 2)
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      
      // Check that result is the number of files cleaned up
      expect(result).toBe(1);
    });

    it('should return 0 if directory does not exist', async () => {
      // Mock access to throw an error
      (fs.access as any).mockRejectedValueOnce(new Error('Directory not found'));
      
      const result = await FileCleanup.cleanupExpiredFiles();
      
      // Check that access was called
      expect(fs.access).toHaveBeenCalled();
      
      // Check that readdir was not called
      expect(fs.readdir).not.toHaveBeenCalled();
      
      // Check that result is 0
      expect(result).toBe(0);
    });
  });

  describe('schedulePeriodicCleanup', () => {
    it('should schedule periodic cleanup', () => {
      // Mock setInterval
      const originalSetInterval = global.setInterval;
      const mockSetInterval = vi.fn().mockReturnValue(123);
      global.setInterval = mockSetInterval as any;
      
      const result = FileCleanup.schedulePeriodicCleanup();
      
      // Check that setInterval was called
      expect(mockSetInterval).toHaveBeenCalled();
      
      // Check that result is the interval ID
      expect(result).toBe(123);
      
      // Restore mocks
      global.setInterval = originalSetInterval;
    });
  });
});