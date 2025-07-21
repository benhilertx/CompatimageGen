import { FileType, ValidationResult, FileError } from '@/types';
import { APP_CONFIG } from '@/config/app-config';

/**
 * Validates uploaded files for type, size, and structure
 */
export class FileValidator {
  /**
   * Validates a file based on its type, size, and content
   * @param file The file to validate
   * @returns Validation result with errors and warnings
   */
  static validateFile(file: File): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check file size
    if (file.size > APP_CONFIG.upload.maxFileSize) {
      result.valid = false;
      result.errors.push(`File size exceeds the maximum limit of ${APP_CONFIG.upload.maxFileSize / 1024 / 1024}MB`);
    }
    
    // Check file type
    const fileType = this.determineFileType(file);
    if (!fileType) {
      result.valid = false;
      result.errors.push('Unsupported file type. Please upload SVG, PNG, JPEG, or CSS files.');
    }
    
    // Add warnings based on file type
    if (fileType === 'svg') {
      result.warnings.push('Complex SVG elements may not convert well to VML for Outlook.');
    } else if (fileType === 'css') {
      result.warnings.push('CSS logos have limited support in email clients and may require rasterization.');
    }
    
    return result;
  }
  
  /**
   * Determines the file type based on MIME type and extension
   * @param file The file to check
   * @returns The determined file type or undefined if not supported
   */
  static determineFileType(file: File): FileType | undefined {
    const { acceptedFileTypes } = APP_CONFIG.upload;
    
    // Check by MIME type
    if (acceptedFileTypes.svg.includes(file.type)) {
      return 'svg';
    } else if (acceptedFileTypes.png.includes(file.type)) {
      return 'png';
    } else if (acceptedFileTypes.jpeg.includes(file.type)) {
      return 'jpeg';
    } else if (acceptedFileTypes.css.includes(file.type)) {
      return 'css';
    }
    
    // If MIME type check fails, try by extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'svg') {
      return 'svg';
    } else if (extension === 'png') {
      return 'png';
    } else if (['jpg', 'jpeg'].includes(extension || '')) {
      return 'jpeg';
    } else if (extension === 'css') {
      return 'css';
    }
    
    // Not a supported file type
    return undefined;
  }
  
  /**
   * Creates a FileError object for consistent error handling
   * @param code Error code
   * @param message Error message
   * @param details Optional details
   * @returns FileError object
   */
  static createError(code: FileError['code'], message: string, details?: string): FileError {
    return {
      code,
      message,
      details
    };
  }
}

export default FileValidator;