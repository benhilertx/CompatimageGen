import { promises as fs } from 'fs';
import path from 'path';
import { APP_CONFIG } from '@/config/app-config';
import os from 'os';

/**
 * Utility for cleaning up temporary files
 */
export class FileCleanup {
  /**
   * Clean up a specific file by ID
   * @param fileId The ID of the file to clean up
   * @returns True if cleanup was successful
   */
  static async cleanupFile(fileId: string): Promise<boolean> {
    try {
      // Use system temp directory or configured directory
      const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
      
      // Find all files with this fileId prefix
      const files = await fs.readdir(tempDir);
      const matchingFiles = files.filter(file => file.startsWith(fileId));
      
      if (matchingFiles.length === 0) {
        return false;
      }
      
      // Delete all matching files
      for (const file of matchingFiles) {
        await fs.unlink(path.join(tempDir, file));
      }
      
      return true;
    } catch (error) {
      console.error('File cleanup error:', error);
      return false;
    }
  }
  
  /**
   * Clean up all expired files
   * @param maxAgeMs Maximum age of files in milliseconds before they're considered expired
   * @returns Number of files cleaned up
   */
  static async cleanupExpiredFiles(maxAgeMs = 3600000): Promise<number> {
    try {
      // Use system temp directory or configured directory
      const tempDir = APP_CONFIG.upload.tempDir || path.join(os.tmpdir(), 'compatimage-uploads');
      
      // Ensure directory exists
      try {
        await fs.access(tempDir);
      } catch (error) {
        // Directory doesn't exist, nothing to clean up
        return 0;
      }
      
      // Get all files in the directory
      const files = await fs.readdir(tempDir);
      const now = Date.now();
      let cleanedCount = 0;
      
      // Check each file
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        
        try {
          const stats = await fs.stat(filePath);
          const fileAge = now - stats.mtimeMs;
          
          // If file is older than maxAge, delete it
          if (fileAge > maxAgeMs) {
            await fs.unlink(filePath);
            cleanedCount++;
          }
        } catch (error) {
          // Skip files that can't be accessed or deleted
          console.error(`Error cleaning up file ${filePath}:`, error);
        }
      }
      
      return cleanedCount;
    } catch (error) {
      console.error('Expired files cleanup error:', error);
      return 0;
    }
  }
  
  /**
   * Schedule periodic cleanup of expired files
   * @param intervalMs Interval in milliseconds between cleanup runs
   * @param maxAgeMs Maximum age of files in milliseconds before they're considered expired
   */
  static schedulePeriodicCleanup(intervalMs = 3600000, maxAgeMs = 3600000): NodeJS.Timeout {
    return setInterval(async () => {
      const cleanedCount = await this.cleanupExpiredFiles(maxAgeMs);
      if (cleanedCount > 0) {
        console.log(`Periodic cleanup: removed ${cleanedCount} expired files`);
      }
    }, intervalMs);
  }
}

export default FileCleanup;