import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileCleanup } from '../file-cleanup';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Mock dependencies
vi.mock('fs', () => ({
  promises: {
    readdir: vi.fn(),
    unlink: vi.fn(),
    stat: vi.fn(),
    access: vi.fn()
  }
}));

vi.mock('os', () => ({
  tmpdir: () => '/mock-tmp'
}));

vi.mock('@/config/app-config', () => ({
  APP_CONFIG: {
    upload: {
      tempDir: '',
      tempFileExpiry: 3600000,
      cleanupInterval: 3600000
    }
  }
}));

describe('FileCleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock file system operations
    (fs.readdir as any).mockResolvedValue(['file1.txt', 'file2.txt', 'test-id.png', 'test-id.meta.json']);
    (fs.unlink as any).mockResolvedValue(undefined);
    (fs.access as any).mockResolvedValue(undefined);
    (fs.stat as any).mockImplementation((filePath) => {
      // Make some files old and some new
      const isOld = filePath.includes('file1');
      return Promise.resolve({
        mtimeMs: Date.now() - (isOld ? 7200000 : 1800000) // 2 hours old or 30 minutes old
      });
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should clean up a specific file by ID', async () => {
    const result = await FileCleanup.cleanupFile('test-id');
    
    expect(result).toBe(true);
    expect(fs.readdir).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledTimes(2); // Should delete both test-id.png and test-id.meta.json
  });
  
  it('should return false if file ID not found', async () => {
    (fs.readdir as any).mockResolvedValue(['file1.txt', 'file2.txt']);
    
    const result = await FileCleanup.cleanupFile('not-found');
    
    expect(result).toBe(false);
    expect(fs.unlink).not.toHaveBeenCalled();
  });
  
  it('should handle errors during file cleanup', async () => {
    (fs.unlink as any).mockRejectedValue(new Error('Cleanup error'));
    
    const result = await FileCleanup.cleanupFile('test-id');
    
    // Should still return true even if there was an error, as long as files were found
    expect(result).toBe(true);
  });
  
  it('should clean up expired files', async () => {
    const result = await FileCleanup.cleanupExpiredFiles(3600000);
    
    expect(result).toBe(1); // Only file1.txt is older than 1 hour
    expect(fs.stat).toHaveBeenCalledTimes(4);
    expect(fs.unlink).toHaveBeenCalledTimes(1);
  });
  
  it('should handle directory not existing', async () => {
    (fs.access as any).mockRejectedValue(new Error('Directory not found'));
    
    const result = await FileCleanup.cleanupExpiredFiles();
    
    expect(result).toBe(0);
    expect(fs.readdir).not.toHaveBeenCalled();
  });
  
  it('should schedule periodic cleanup', () => {
    vi.useFakeTimers();
    
    const spy = vi.spyOn(FileCleanup, 'cleanupExpiredFiles').mockResolvedValue(5);
    
    const interval = FileCleanup.schedulePeriodicCleanup(1000, 3600000);
    
    // Fast-forward time
    vi.advanceTimersByTime(1000);
    
    expect(spy).toHaveBeenCalledWith(3600000);
    
    // Clean up
    clearInterval(interval);
    vi.useRealTimers();
    spy.mockRestore();
  });
});