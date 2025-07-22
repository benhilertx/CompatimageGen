import sharp, { Sharp, OutputInfo, ResizeOptions } from 'sharp';
import { APP_CONFIG } from '../../config/app-config';
import { Warning } from '../../types';

/**
 * Service for processing and optimizing images using Sharp
 */
export class ImageProcessingService {
  /**
   * Compress a PNG image with optimized settings
   * @param imageBuffer Original PNG image buffer
   * @param quality Quality level (0-100)
   * @returns Compressed image buffer
   */
  static async compressPng(
    imageBuffer: Buffer,
    quality: number = APP_CONFIG.processing.imageOptions.png.quality
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .png({
          quality,
          compressionLevel: APP_CONFIG.processing.imageOptions.png.compressionLevel,
          adaptiveFiltering: APP_CONFIG.processing.imageOptions.png.adaptiveFiltering
        })
        .toBuffer();
    } catch (error) {
      console.error('PNG compression error:', error);
      throw new Error(`Failed to compress PNG: ${(error as Error).message}`);
    }
  }

  /**
   * Compress a JPEG image with optimized settings
   * @param imageBuffer Original JPEG image buffer
   * @param quality Quality level (0-100)
   * @returns Compressed image buffer
   */
  static async compressJpeg(
    imageBuffer: Buffer,
    quality: number = APP_CONFIG.processing.imageOptions.jpeg.quality
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .jpeg({
          quality,
          progressive: APP_CONFIG.processing.imageOptions.jpeg.progressive
        })
        .toBuffer();
    } catch (error) {
      console.error('JPEG compression error:', error);
      throw new Error(`Failed to compress JPEG: ${(error as Error).message}`);
    }
  }

  /**
   * Convert an image to base64 data URI
   * @param imageBuffer Image buffer
   * @param mimeType MIME type of the image
   * @returns Base64 data URI string
   */
  static convertToBase64DataUri(imageBuffer: Buffer, mimeType: string): string {
    try {
      const base64String = imageBuffer.toString('base64');
      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error('Base64 conversion error:', error);
      throw new Error(`Failed to convert image to base64: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a PNG fallback from SVG content
   * @param svgBuffer SVG content as buffer or string
   * @param width Output width
   * @param height Output height
   * @returns PNG buffer
   */
  static async generatePngFromSvg(
    svgBuffer: Buffer | string,
    width: number = APP_CONFIG.processing.defaultDimensions.width,
    height: number = APP_CONFIG.processing.defaultDimensions.height
  ): Promise<Buffer> {
    try {
      // Convert string to buffer if needed
      const buffer = typeof svgBuffer === 'string' ? Buffer.from(svgBuffer) : svgBuffer;
      
      return await sharp(buffer)
        .resize(width, height)
        .png(APP_CONFIG.processing.imageOptions.png)
        .toBuffer();
    } catch (error) {
      console.error('SVG to PNG conversion error:', error);
      throw new Error(`Failed to convert SVG to PNG: ${(error as Error).message}`);
    }
  }

  /**
   * Resize an image while maintaining aspect ratio
   * @param imageBuffer Original image buffer
   * @param width Target width
   * @param height Target height
   * @param fit Fit strategy
   * @returns Resized image buffer
   */
  static async resizeImage(
    imageBuffer: Buffer,
    width: number,
    height: number,
    fit: keyof sharp.FitEnum = 'contain'
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize({
          width,
          height,
          fit,
          withoutEnlargement: true
        })
        .toBuffer();
    } catch (error) {
      console.error('Image resize error:', error);
      throw new Error(`Failed to resize image: ${(error as Error).message}`);
    }
  }

  /**
   * Optimize an image based on its type with quality and size management
   * @param imageBuffer Original image buffer
   * @param mimeType MIME type of the image
   * @param options Optimization options
   * @returns Optimized image buffer and metadata
   */
  static async optimizeImage(
    imageBuffer: Buffer,
    mimeType: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      optimizationLevel?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<{ buffer: Buffer; info: OutputInfo; warnings: Warning[] }> {
    const warnings: Warning[] = [];
    
    try {
      // Determine quality based on optimization level
      let quality = options.quality;
      if (!quality && options.optimizationLevel) {
        switch (options.optimizationLevel) {
          case 'low':
            quality = 95;
            break;
          case 'medium':
            quality = 85;
            break;
          case 'high':
            quality = 75;
            break;
        }
      }
      
      // Get image dimensions if not provided
      const width = options.width || APP_CONFIG.processing.defaultDimensions.width;
      const height = options.height || APP_CONFIG.processing.defaultDimensions.height;
      
      // Create Sharp instance
      let sharpInstance = sharp(imageBuffer);
      
      // Get original metadata
      const metadata = await sharpInstance.metadata();
      
      // Check if image is too large
      if (metadata.width && metadata.height) {
        const area = metadata.width * metadata.height;
        if (area > 2000 * 2000) {
          warnings.push({
            type: 'file-size',
            message: 'Image dimensions are very large and may cause issues in email clients',
            severity: 'medium'
          });
        }
      }
      
      // Resize if dimensions are provided
      if (width && height) {
        sharpInstance = sharpInstance.resize({
          width,
          height,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Apply format-specific optimizations
      let outputBuffer: Buffer;
      let outputInfo: OutputInfo;
      
      if (mimeType === 'image/png') {
        const result = await sharpInstance
          .png({
            quality: quality || APP_CONFIG.processing.imageOptions.png.quality,
            compressionLevel: APP_CONFIG.processing.imageOptions.png.compressionLevel,
            adaptiveFiltering: APP_CONFIG.processing.imageOptions.png.adaptiveFiltering
          })
          .toBuffer({ resolveWithObject: true });
        
        outputBuffer = result.data;
        outputInfo = result.info;
      } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        const result = await sharpInstance
          .jpeg({
            quality: quality || APP_CONFIG.processing.imageOptions.jpeg.quality,
            progressive: APP_CONFIG.processing.imageOptions.jpeg.progressive
          })
          .toBuffer({ resolveWithObject: true });
        
        outputBuffer = result.data;
        outputInfo = result.info;
      } else {
        // Default to PNG for other formats
        const result = await sharpInstance
          .png()
          .toBuffer({ resolveWithObject: true });
        
        outputBuffer = result.data;
        outputInfo = result.info;
        
        warnings.push({
          type: 'file-size',
          message: `Unsupported image format: ${mimeType}. Converted to PNG.`,
          severity: 'medium'
        });
      }
      
      // Check if the optimized image is still large
      if (outputBuffer.length > APP_CONFIG.upload.maxFileSize / 2) {
        warnings.push({
          type: 'file-size',
          message: 'Optimized image is still large and may cause issues in email clients',
          severity: 'medium'
        });
      }
      
      return {
        buffer: outputBuffer,
        info: outputInfo,
        warnings
      };
    } catch (error) {
      console.error('Image optimization error:', error);
      throw new Error(`Failed to optimize image: ${(error as Error).message}`);
    }
  }

  /**
   * Create a fallback image when processing fails
   * @param width Image width
   * @param height Image height
   * @param color Background color (default: light gray)
   * @returns Buffer containing a simple PNG image
   */
  static async createFallbackImage(
    width: number = APP_CONFIG.processing.defaultDimensions.width,
    height: number = APP_CONFIG.processing.defaultDimensions.height,
    color: { r: number; g: number; b: number; alpha: number } = { r: 200, g: 200, b: 200, alpha: 1 }
  ): Promise<Buffer> {
    try {
      return await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: color
        }
      })
      .png()
      .toBuffer();
    } catch (error) {
      console.error('Fallback image creation error:', error);
      
      // Create an even simpler fallback if the first attempt fails
      const simpleBuffer = Buffer.alloc(width * height * 4);
      // Fill with light gray
      for (let i = 0; i < simpleBuffer.length; i += 4) {
        simpleBuffer[i] = 200;     // R
        simpleBuffer[i + 1] = 200; // G
        simpleBuffer[i + 2] = 200; // B
        simpleBuffer[i + 3] = 255; // Alpha
      }
      
      return await sharp(simpleBuffer, {
        raw: {
          width,
          height,
          channels: 4
        }
      })
      .png()
      .toBuffer();
    }
  }
}

export default ImageProcessingService;