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
  static async validateFile(file: File): Promise<ValidationResult> {
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
    
    // Check if file is empty
    if (file.size === 0) {
      result.valid = false;
      result.errors.push('File is empty. Please upload a valid file.');
      return result;
    }
    
    // Check file type
    const fileType = this.determineFileType(file);
    if (!fileType) {
      result.valid = false;
      result.errors.push('Unsupported file type. Please upload SVG, PNG, JPEG, or CSS files.');
      return result;
    }
    
    // Perform structure validation based on file type
    try {
      await this.validateFileStructure(file, fileType, result);
    } catch (error) {
      result.valid = false;
      result.errors.push(`File structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Add warnings based on file type
    if (fileType === 'svg') {
      result.warnings.push('Complex SVG elements may not convert well to VML for Outlook.');
      
      // Check for SVG complexity
      try {
        const svgContent = await file.text();
        if (this.isSvgComplex(svgContent)) {
          result.warnings.push('This SVG contains complex elements that may not render correctly in all email clients.');
        }
      } catch (error) {
        result.warnings.push('Could not analyze SVG complexity. Some features may not render correctly.');
      }
    } else if (fileType === 'css') {
      result.warnings.push('CSS logos have limited support in email clients and may require rasterization.');
    }
    
    return result;
  }
  
  /**
   * Validates the structure of a file based on its type
   * @param file The file to validate
   * @param fileType The determined file type
   * @param result Validation result to update
   */
  static async validateFileStructure(file: File, fileType: FileType, result: ValidationResult): Promise<void> {
    switch (fileType) {
      case 'svg':
        await this.validateSvgStructure(file, result);
        break;
      case 'png':
      case 'jpeg':
        await this.validateImageStructure(file, result);
        break;
      case 'css':
        await this.validateCssStructure(file, result);
        break;
    }
  }
  
  /**
   * Validates SVG file structure
   * @param file SVG file to validate
   * @param result Validation result to update
   */
  static async validateSvgStructure(file: File, result: ValidationResult): Promise<void> {
    try {
      const svgContent = await file.text();
      
      // Check if content starts with SVG tag or XML declaration
      if (!svgContent.trim().startsWith('<svg') && !svgContent.trim().startsWith('<?xml')) {
        result.valid = false;
        result.errors.push('Invalid SVG structure. File does not contain a valid SVG element.');
        return;
      }
      
      // Check for required SVG attributes
      if (!svgContent.includes('xmlns=')) {
        result.warnings.push('SVG is missing xmlns attribute, which may cause rendering issues in some email clients.');
      }
      
      // Check for potentially dangerous elements
      const dangerousElements = ['script', 'foreignObject', 'iframe'];
      for (const element of dangerousElements) {
        if (svgContent.includes(`<${element}`)) {
          result.warnings.push(`SVG contains potentially dangerous <${element}> element that will be removed during processing.`);
        }
      }
      
      // Check for external references
      if (svgContent.includes('xlink:href="http') || svgContent.includes('href="http')) {
        result.warnings.push('SVG contains external references which may not work in email clients due to security restrictions.');
      }
    } catch (error) {
      result.valid = false;
      result.errors.push('Failed to parse SVG content. The file may be corrupted.');
    }
  }
  
  /**
   * Validates image file structure
   * @param file Image file to validate
   * @param result Validation result to update
   */
  static async validateImageStructure(file: File, result: ValidationResult): Promise<void> {
    try {
      // Check image header bytes
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer.slice(0, 8));
      
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47;
      
      // JPEG signature: FF D8 FF
      const isJpeg = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
      
      const fileType = this.determineFileType(file);
      
      if ((fileType === 'png' && !isPng) || (fileType === 'jpeg' && !isJpeg)) {
        result.valid = false;
        result.errors.push(`File has ${fileType} extension but does not contain valid ${fileType.toUpperCase()} data.`);
      }
    } catch (error) {
      result.warnings.push('Could not verify image structure. The file may be corrupted.');
    }
  }
  
  /**
   * Validates CSS file structure
   * @param file CSS file to validate
   * @param result Validation result to update
   */
  static async validateCssStructure(file: File, result: ValidationResult): Promise<void> {
    try {
      const cssContent = await file.text();
      
      // Very basic CSS validation - check for balanced braces
      let openBraces = 0;
      let closeBraces = 0;
      
      for (const char of cssContent) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
      }
      
      if (openBraces !== closeBraces) {
        result.warnings.push('CSS file has unbalanced braces, which may indicate syntax errors.');
      }
      
      // Check for email-incompatible CSS features
      const incompatibleFeatures = [
        '@import', '@media', '@keyframes', 'animation', 'transition',
        'display: flex', 'display: grid', 'position: sticky'
      ];
      
      for (const feature of incompatibleFeatures) {
        if (cssContent.includes(feature)) {
          result.warnings.push(`CSS contains "${feature}" which is not supported in many email clients.`);
        }
      }
    } catch (error) {
      result.warnings.push('Could not validate CSS structure. The file may contain syntax errors.');
    }
  }
  
  /**
   * Determines if an SVG is complex (contains animations, gradients, filters, etc.)
   * @param svgContent SVG content as string
   * @returns True if SVG is complex
   */
  static isSvgComplex(svgContent: string): boolean {
    const complexFeatures = [
      'animate', 'animateTransform', 'animateMotion',
      'linearGradient', 'radialGradient',
      'filter', 'feGaussianBlur', 'feOffset',
      'mask', 'clipPath',
      'text-anchor', 'textPath'
    ];
    
    return complexFeatures.some(feature => svgContent.includes(feature));
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