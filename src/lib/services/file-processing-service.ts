import { FileData, FileType, ProcessingOptions, ProcessingResult, ValidationResult, Warning } from '../../types';
import { APP_CONFIG } from '../../config/app-config';
import { SVGProcessingService } from './svg-processing-service';
import { ImageProcessingService } from './image-processing-service';
import { VMLGeneratorService } from './vml-generator-service';

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
    
    // Generate PNG fallback using ImageProcessingService
    try {
      const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
      result.pngFallback = await ImageProcessingService.generatePngFromSvg(
        result.optimizedSvg || svgString,
        dimensions.width,
        dimensions.height
      );
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
    result.base64DataUri = ImageProcessingService.convertToBase64DataUri(
      result.pngFallback,
      'image/png'
    );
    
    // Generate VML code using VMLGeneratorService
    try {
      const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
      const canConvertToVml = SVGProcessingService.canConvertToVml(result.optimizedSvg || svgString);
      
      if (canConvertToVml) {
        const vmlResult = await VMLGeneratorService.convertSvgToVml(
          result.optimizedSvg || svgString,
          dimensions.width,
          dimensions.height
        );
        
        result.vmlCode = VMLGeneratorService.addOutlookStyling(vmlResult.vmlCode);
        
        // Add any warnings from VML generation
        if (result.warnings && vmlResult.warnings.length > 0) {
          result.warnings.push(...vmlResult.warnings);
        }
        
        // Validate the generated VML
        const validation = VMLGeneratorService.validateVml(result.vmlCode);
        if (!validation.valid && validation.warnings.length > 0) {
          result.warnings?.push(...validation.warnings);
        }
      } else {
        result.warnings?.push({
          type: 'vml-conversion',
          message: 'SVG contains features that cannot be converted to VML. Using PNG fallback for Outlook.',
          severity: 'medium'
        });
        
        // Use placeholder VML with warning
        result.vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:' + 
          dimensions.width + 'px;height:' + dimensions.height + 
          'px;" fillcolor="#CCCCCC" stroked="false"><v:textbox inset="0,0,0,0"><center style="color:#666666;font-family:Arial;font-size:12px;">Image</center></v:textbox></v:rect><![endif]-->';
      }
    } catch (error) {
      console.error('VML generation error:', error);
      result.warnings?.push({
        type: 'vml-conversion',
        message: `Failed to generate VML: ${(error as Error).message}`,
        severity: 'high'
      });
      
      // Use placeholder VML with error
      const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
      result.vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:' + 
        dimensions.width + 'px;height:' + dimensions.height + 
        'px;" fillcolor="#FFCCCC" stroked="false"><v:textbox inset="0,0,0,0"><center style="color:#CC0000;font-family:Arial;font-size:12px;">Error</center></v:textbox></v:rect><![endif]-->';
    }
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
    
    // Optimize image using ImageProcessingService
    try {
      const optimizationResult = await ImageProcessingService.optimizeImage(
        fileData.buffer,
        fileData.mimeType,
        {
          width: dimensions.width,
          height: dimensions.height,
          optimizationLevel: options.optimizationLevel
        }
      );
      
      // Store the optimized image as PNG fallback
      result.pngFallback = optimizationResult.buffer;
      
      // Add any warnings from the optimization process
      if (result.warnings && optimizationResult.warnings.length > 0) {
        result.warnings.push(...optimizationResult.warnings);
      }
    } catch (error) {
      console.error('Image processing error:', error);
      result.warnings?.push({
        type: 'file-size',
        message: 'Image optimization failed, using original image',
        severity: 'medium'
      });
      
      // If optimization fails, try to convert to PNG without optimization
      try {
        if (fileData.fileType === 'png') {
          result.pngFallback = await ImageProcessingService.compressPng(fileData.buffer);
        } else if (fileData.fileType === 'jpeg') {
          // Convert JPEG to PNG for consistency
          result.pngFallback = await ImageProcessingService.compressJpeg(fileData.buffer);
        } else {
          // Fallback to original buffer
          result.pngFallback = fileData.buffer;
        }
      } catch (fallbackError) {
        console.error('Fallback image processing error:', fallbackError);
        // Create a simple fallback image as last resort
        result.pngFallback = await ImageProcessingService.createFallbackImage(
          dimensions.width,
          dimensions.height
        );
      }
    }
    
    // Generate base64 data URI
    result.base64DataUri = ImageProcessingService.convertToBase64DataUri(
      result.pngFallback,
      'image/png'
    );
    
    // No SVG or VML for image inputs, use placeholder VML
    const imageDimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
    result.vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:' + 
      imageDimensions.width + 'px;height:' + imageDimensions.height + 
      'px;" filled="true" fillcolor="#FFFFFF" stroked="false"><v:imagedata src="#" o:title="Image"/></v:rect><![endif]-->';
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
    // Use placeholder VML for CSS files
    const cssDimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
    result.vmlCode = '<!--[if vml]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" style="width:' + 
      cssDimensions.width + 'px;height:' + cssDimensions.height + 
      'px;" fillcolor="#EEEEEE" stroked="false"><v:textbox inset="0,0,0,0"><center style="color:#666666;font-family:Arial;font-size:12px;">CSS Logo</center></v:textbox></v:rect><![endif]-->';
  }
  
  /**
   * Create a simple fallback image when processing fails
   * @param options Processing options
   * @returns Buffer containing a simple PNG image
   */
  private static async createFallbackImage(options: ProcessingOptions): Promise<Buffer> {
    const dimensions = options.dimensions || APP_CONFIG.processing.defaultDimensions;
    
    // Use ImageProcessingService to create a fallback image
    return await ImageProcessingService.createFallbackImage(
      dimensions.width,
      dimensions.height,
      { r: 200, g: 200, b: 200, alpha: 1 }
    );
  }
  
  /**
   * Generate HTML snippet with fallbacks using HTMLTemplateService
   * @param result Processing result
   * @returns HTML snippet string
   */
  private static async generateHtmlSnippet(result: ProcessingResult): Promise<string> {
    // Import HTMLTemplateService
    const { HTMLTemplateService } = await import('./html-template-service');
    
    // Use default dimensions from config
    const dimensions = APP_CONFIG.processing.defaultDimensions;
    
    // Extract base64 data from the data URI if it exists
    let pngBase64 = '';
    if (result.base64DataUri && result.base64DataUri.includes('base64,')) {
      pngBase64 = result.base64DataUri.split('base64,')[1];
    }
    
    // Create fallback data for HTML generation
    const fallbackData = {
      svgContent: result.optimizedSvg,
      pngBase64: pngBase64,
      vmlCode: result.vmlCode,
      dimensions: dimensions,
      altText: result.originalFile ? result.originalFile.originalName.replace(/\.[^/.]+$/, '') : 'Logo' // Use filename without extension as alt text
    };
    
    // Generate HTML using HTMLTemplateService
    return HTMLTemplateService.generateEmailHtml(fallbackData);
  }
}

export default FileProcessingService;