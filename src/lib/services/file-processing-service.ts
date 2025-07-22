import { FileData, FileType, ProcessingOptions, ProcessingResult, ValidationResult, Warning } from '../../types';
import { APP_CONFIG } from '../../config/app-config';
import sharp from 'sharp';
import { SVGProcessingService } from './svg-processing-service';

/**
 * Service for processing uploaded files
 */
export class FileProcessingService {
  /**
   * Process a file based on its type
   * @param fileData The file data to process
   * @param options Processing options
   * @returns Processing result
   */
  static async processFile(fileData: FileData, options: ProcessingOptions): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    // Initialize result with original file data
    const result: Partial<ProcessingResult> = {
      originalFile: fileData,
      warnings: []
    };
    
    try {
      // Process based on file type
      switch (fileData.fileType) {
        case 'svg':
          await this.processSvgFile(fileData, options, result);
          break;
        case 'png':
        case 'jpeg':
          await this.processImageFile(fileData, options, result);
          break;
        case 'css':
          await this.processCssFile(fileData, options, result);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileData.fileType}`);
      }
      
      // Generate HTML snippet
      result.htmlSnippet = await this.generateHtmlSnippet(result as ProcessingResult);
      
      // Add metadata
      const endTime = Date.now();
      result.metadata = {
        originalFileSize: fileData.size,
        optimizedFileSize: result.optimizedSvg?.length || fileData.size,
        compressionRatio: (result.optimizedSvg?.length || fileData.size) / fileData.size,
        processingTime: endTime - startTime,
        generatedAt: new Date().toISOString()
      };
      
      return result as ProcessingResult;
    } catch (error) {
      console.error('File processing error:', error);
      throw error;
    }
  }
  
  /**
   * Process an SVG file
   * @param fileData SVG file data
   * @param options Processing options
   * @param result Result object to update
   */
  private static async processSvgFile(
    fileData: FileData, 
    options: ProcessingOptions, 
    result: Partial<ProcessingResult>
  ): Promise<void> {
    // Convert buffer to string
    const svgString = fileData.buffer.toString('utf-8');
    
    // Process SVG using SVGProcessingService
    try {
      const { optimizedSvg, warnings } = await SVGProcessingService.processSvg(svgString);
      result.optimizedSvg = optimizedSvg;
      
      // Add warnings from SVG processing
      if (result.warnings && warnings.length > 0) {
        result.warnings.push(...warnings);
      }
      
      // Check if SVG can be converted to VML
      const canConvertToVml = SVGProcessingService.canConvertToVml(optimizedSvg);
      if (!canConvertToVml) {
        result.warnings?.push({
          type: 'vml-conversion',
          message: 'This SVG contains features that cannot be converted to VML for Outlook. PNG fallback will be used instead.',
          severity: 'high'
        });
      }
    } catch (error) {
      console.error('SVG processing error:', error);
      result.warnings?.push({
        type: 'svg-complexity',
        message: 'SVG processing failed, using original SVG',
        severity: 'medium'
      });
      result.optimizedSvg = svgString;
    }
    
    // Generate PNG fallback
    try {
      const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
      result.pngFallback = await sharp(Buffer.from(result.optimizedSvg || svgString))
        .resize(dimensions.width, dimensions.height)
        .png(APP_CONFIG.processing.imageOptions.png)
        .toBuffer();
    } catch (error) {
      console.error('PNG fallback generation error:', error);
      result.warnings?.push({
        type: 'svg-complexity',
        message: 'Failed to generate PNG fallback from SVG',
        severity: 'high'
      });
      // Create a simple fallback image
      result.pngFallback = await this.createFallbackImage(options);
    }
    
    // Generate base64 data URI
    result.base64DataUri = `data:image/png;base64,${result.pngFallback.toString('base64')}`;
    
    // TODO: Generate VML code (will be implemented in VML generation service)
    result.vmlCode = '<!-- VML code will be generated here -->';
  }
  
  /**
   * Process a PNG or JPEG image file
   * @param fileData Image file data
   * @param options Processing options
   * @param result Result object to update
   */
  private static async processImageFile(
    fileData: FileData, 
    options: ProcessingOptions, 
    result: Partial<ProcessingResult>
  ): Promise<void> {
    const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
    
    // Optimize image
    try {
      const imageOptions = fileData.fileType === 'png' 
        ? APP_CONFIG.processing.imageOptions.png 
        : APP_CONFIG.processing.imageOptions.jpeg;
      
      const sharpInstance = sharp(fileData.buffer)
        .resize(dimensions.width, dimensions.height);
      
      // Apply format-specific options
      result.pngFallback = await (fileData.fileType === 'png' 
        ? sharpInstance.png(imageOptions).toBuffer()
        : sharpInstance.png(APP_CONFIG.processing.imageOptions.png).toBuffer());
    } catch (error) {
      console.error('Image processing error:', error);
      result.warnings?.push({
        type: 'file-size',
        message: 'Image optimization failed, using original image',
        severity: 'medium'
      });
      result.pngFallback = fileData.buffer;
    }
    
    // Generate base64 data URI
    result.base64DataUri = `data:image/png;base64,${result.pngFallback.toString('base64')}`;
    
    // No SVG or VML for image inputs
    result.vmlCode = '<!-- VML code will be generated here -->';
  }
  
  /**
   * Process a CSS file (placeholder - will be implemented later)
   * @param fileData CSS file data
   * @param options Processing options
   * @param result Result object to update
   */
  private static async processCssFile(
    fileData: FileData, 
    options: ProcessingOptions, 
    result: Partial<ProcessingResult>
  ): Promise<void> {
    // CSS processing is complex and will be implemented in a separate service
    result.warnings?.push({
      type: 'css-compatibility',
      message: 'CSS logo processing is not fully implemented yet',
      severity: 'high'
    });
    
    // Create a fallback image for now
    result.pngFallback = await this.createFallbackImage(options);
    result.base64DataUri = `data:image/png;base64,${result.pngFallback.toString('base64')}`;
    result.vmlCode = '<!-- VML code will be generated here -->';
  }
  
  /**
   * Create a simple fallback image when processing fails
   * @param options Processing options
   * @returns Buffer containing a simple PNG image
   */
  private static async createFallbackImage(options: ProcessingOptions): Promise<Buffer> {
    const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
    
    // Create a simple colored square as fallback
    return await sharp({
      create: {
        width: dimensions.width,
        height: dimensions.height,
        channels: 4,
        background: { r: 200, g: 200, b: 200, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
  }
  
  /**
   * Generate HTML snippet with fallbacks (placeholder - will be implemented in HTMLTemplateService)
   * @param result Processing result
   * @returns HTML snippet string
   */
  private static async generateHtmlSnippet(result: ProcessingResult): Promise<string> {
    // This is a placeholder - the actual implementation will be in HTMLTemplateService
    return `
<!-- Email Logo HTML with Fallbacks -->
<!-- This is a placeholder. The actual HTML will be generated by HTMLTemplateService -->
<div style="max-width: 100%;">
  <!-- Fallback image -->
  <img src="${result.base64DataUri}" alt="Logo" style="max-width: 100%; height: auto;" />
</div>
    `.trim();
  }
}

export default FileProcessingService;