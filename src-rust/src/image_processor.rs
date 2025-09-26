//! Image processing module using photon-rs
//! 
//! This module provides high-performance image processing capabilities
//! including filters, transformations, and color adjustments.

use photon_rs::PhotonImage;
use serde::{Deserialize, Serialize};
use image::{ImageFormat, DynamicImage};
use std::io::Cursor;

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageProcessingOptions {
    pub operation: String,
    pub filter: Option<String>,
    pub intensity: Option<f32>,
    pub brightness: Option<f32>,
    pub contrast: Option<f32>,
    pub saturation: Option<f32>,
    pub hue_rotation: Option<f32>,
    pub resize_width: Option<u32>,
    pub resize_height: Option<u32>,
    pub keep_aspect_ratio: Option<bool>,
    pub crop_x: Option<u32>,
    pub crop_y: Option<u32>,
    pub crop_width: Option<u32>,
    pub crop_height: Option<u32>,
    pub rotation_angle: Option<f32>,
    pub flip_horizontal: Option<bool>,
    pub flip_vertical: Option<bool>,
    pub output_format: Option<String>,
    pub quality: Option<u8>,
    pub output_as_binary: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageMetadata {
    pub width: u32,
    pub height: u32,
    pub format: String,
    pub size_bytes: usize,
    pub processing_time_ms: u128,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImageProcessingResult {
    pub success: bool,
    pub image_data: Option<String>, // base64 encoded (data URL or raw base64)
    pub binary_data: Option<Vec<u8>>, // raw binary data
    pub metadata: Option<ImageMetadata>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BatchProcessingResult {
    pub processed: usize,
    pub successful: usize,
    pub failed: usize,
    pub results: Vec<ImageProcessingResult>,
    pub total_time_ms: u128,
}

pub struct ImageProcessor;

impl ImageProcessor {
    pub fn new() -> Self {
        Self
    }

    /// Convert base64 string to PhotonImage
    pub fn base64_to_photon_image(base64_data: &str) -> Result<PhotonImage, String> {
        // Remove data URL prefix if present
        let clean_data = if base64_data.starts_with("data:") {
            base64_data.split(',').nth(1).unwrap_or(base64_data)
        } else {
            base64_data
        };

        use base64::Engine;
        let engine = base64::engine::general_purpose::STANDARD;
        let image_bytes = engine.decode(clean_data)
            .map_err(|e| format!("Failed to decode base64: {}", e))?;

        let dynamic_image = image::load_from_memory(&image_bytes)
            .map_err(|e| format!("Failed to load image: {}", e))?;

        let rgba_image = dynamic_image.to_rgba8();
        let width = rgba_image.width();
        let height = rgba_image.height();
        let photon_image = PhotonImage::new(rgba_image.into_raw(), width, height);
        
        Ok(photon_image)
    }

    /// Convert PhotonImage to binary bytes
    pub fn photon_image_to_bytes(image: &PhotonImage, format: &str, quality: Option<u8>) -> Result<Vec<u8>, String> {
        let width = image.get_width();
        let height = image.get_height();
        let raw_data = image.get_raw_pixels();

        // Convert to DynamicImage
        let rgba_image = image::RgbaImage::from_raw(width, height, raw_data.clone())
            .ok_or("Failed to create RGBA image")?;
        let dynamic_image = DynamicImage::ImageRgba8(rgba_image);

        // Encode to bytes
        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);

        match format.to_lowercase().as_str() {
            "jpeg" | "jpg" => {
                let rgb_image = dynamic_image.to_rgb8();
                let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(
                    &mut cursor, 
                    quality.unwrap_or(85)
                );
                encoder.encode(
                    rgb_image.as_raw(),
                    rgb_image.width(),
                    rgb_image.height(),
                    image::ExtendedColorType::Rgb8,
                ).map_err(|e| format!("JPEG encoding failed: {}", e))?;
            }
            "png" => {
                dynamic_image.write_to(&mut cursor, ImageFormat::Png)
                    .map_err(|e| format!("PNG encoding failed: {}", e))?;
            }
            "webp" => {
                dynamic_image.write_to(&mut cursor, ImageFormat::WebP)
                    .map_err(|e| format!("WebP encoding failed: {}", e))?;
            }
            _ => {
                return Err(format!("Unsupported output format: {}", format));
            }
        }

        Ok(buffer)
    }

    /// Convert bytes to base64 data URL
    pub fn bytes_to_base64_data_url(bytes: &[u8], format: &str) -> String {
        use base64::Engine;
        let engine = base64::engine::general_purpose::STANDARD;
        let encoded = engine.encode(bytes);
        format!("data:image/{};base64,{}", format, encoded)
    }

    /// Convert bytes to raw base64 string
    pub fn bytes_to_base64(bytes: &[u8]) -> String {
        use base64::Engine;
        let engine = base64::engine::general_purpose::STANDARD;
        engine.encode(bytes)
    }

    /// Process a single image with the given options
    pub fn process_image(base64_input: &str, options: &ImageProcessingOptions) -> ImageProcessingResult {
        // Note: WASM doesn't support std::time::Instant, so we'll use a placeholder for timing

        let mut photon_image = match Self::base64_to_photon_image(base64_input) {
            Ok(img) => img,
            Err(e) => return ImageProcessingResult {
                success: false,
                image_data: None,
                binary_data: None,
                metadata: None,
                error: Some(e),
            },
        };

        // Apply the requested operation
        let operation_result = match options.operation.as_str() {
            "filter" => Self::apply_filter(&mut photon_image, options),
            "transform" => Self::apply_transform(&mut photon_image, options),
            "adjust" => Self::apply_adjustments(&mut photon_image, options),
            "effect" => Self::apply_effects(&mut photon_image, options),
            _ => Err(format!("Unknown operation: {}", options.operation)),
        };

        if let Err(e) = operation_result {
            return ImageProcessingResult {
                success: false,
                image_data: None,
                binary_data: None,
                metadata: None,
                error: Some(e),
            };
        }

        // Convert to bytes first
        let output_format = options.output_format.as_deref().unwrap_or("png");
        let image_bytes = match Self::photon_image_to_bytes(&photon_image, output_format, options.quality) {
            Ok(bytes) => bytes,
            Err(e) => return ImageProcessingResult {
                success: false,
                image_data: None,
                binary_data: None,
                metadata: None,
                error: Some(e),
            },
        };

        // Determine output format based on options
        let output_as_binary = options.output_as_binary.unwrap_or(false);
        let (image_data, binary_data) = if output_as_binary {
            (Some(Self::bytes_to_base64(&image_bytes)), Some(image_bytes.clone()))
        } else {
            (Some(Self::bytes_to_base64_data_url(&image_bytes, output_format)), None)
        };

        // WASM doesn't support timing, so we'll use a placeholder
        let processing_time_ms = 0u128;
        let metadata = ImageMetadata {
            width: photon_image.get_width(),
            height: photon_image.get_height(),
            format: output_format.to_string(),
            size_bytes: image_bytes.len(),
            processing_time_ms,
        };

        ImageProcessingResult {
            success: true,
            image_data,
            binary_data,
            metadata: Some(metadata),
            error: None,
        }
    }

    /// Apply filters to the image
    fn apply_filter(image: &mut PhotonImage, options: &ImageProcessingOptions) -> Result<(), String> {
        let filter = options.filter.as_deref().unwrap_or("none");
        let intensity = options.intensity.unwrap_or(1.0);

        match filter {
            "grayscale" => photon_rs::monochrome::grayscale(image),
            "sepia" => photon_rs::monochrome::sepia(image),
            "invert" => photon_rs::channels::invert(image),
            "vintage" => {
                // Apply a combination of effects for vintage look
                photon_rs::monochrome::sepia(image);
                let brightness_adj = if intensity < 0.5 { 20 } else { 0 };
                if brightness_adj > 0 {
                    photon_rs::effects::inc_brightness(image, brightness_adj);
                }
            }
            "noir" => {
                photon_rs::monochrome::grayscale(image);
                photon_rs::effects::inc_brightness(image, 10);
            }
            "warm" => {
                photon_rs::channels::alter_red_channel(image, (intensity * 20.0) as i16);
                photon_rs::channels::alter_blue_channel(image, -(intensity * 10.0) as i16);
            }
            "cool" => {
                photon_rs::channels::alter_blue_channel(image, (intensity * 20.0) as i16);
                photon_rs::channels::alter_red_channel(image, -(intensity * 10.0) as i16);
            }
            "dramatic" => photon_rs::filters::dramatic(image),
            "firenze" => photon_rs::filters::firenze(image),
            "golden" => photon_rs::filters::golden(image),
            "lix" => photon_rs::filters::lix(image),
            "lofi" => photon_rs::filters::lofi(image),
            "neue" => photon_rs::filters::neue(image),
            "obsidian" => photon_rs::filters::obsidian(image),
            "pastel_pink" => photon_rs::filters::pastel_pink(image),
            "ryo" => photon_rs::filters::ryo(image),
            _ => return Err(format!("Unknown filter: {}", filter)),
        }

        Ok(())
    }

    /// Apply transformations to the image
    fn apply_transform(image: &mut PhotonImage, options: &ImageProcessingOptions) -> Result<(), String> {
        // Handle resize
        if let (Some(width), Some(height)) = (options.resize_width, options.resize_height) {
            let keep_aspect = options.keep_aspect_ratio.unwrap_or(true);
            if keep_aspect {
                // Calculate aspect ratio preserving dimensions
                let original_width = image.get_width() as f32;
                let original_height = image.get_height() as f32;
                let aspect_ratio = original_width / original_height;
                
                let (new_width, new_height) = if width as f32 / height as f32 > aspect_ratio {
                    (height as f32 * aspect_ratio, height as f32)
                } else {
                    (width as f32, width as f32 / aspect_ratio)
                };
                
                *image = photon_rs::transform::resize(image, new_width as u32, new_height as u32, photon_rs::transform::SamplingFilter::Nearest);
            } else {
                *image = photon_rs::transform::resize(image, width, height, photon_rs::transform::SamplingFilter::Nearest);
            }
        }

        // Handle crop
        if let (Some(x), Some(y), Some(w), Some(h)) = (options.crop_x, options.crop_y, options.crop_width, options.crop_height) {
            *image = photon_rs::transform::crop(image, x, y, w, h);
        }

        // Handle rotation - simplified for now
        if let Some(_angle) = options.rotation_angle {
            // Rotation feature will be implemented in future version
            // The photon-rs API for rotation varies between versions
            return Err("Rotation feature not yet implemented".to_string());
        }

        // Handle flips
        if options.flip_horizontal.unwrap_or(false) {
            photon_rs::transform::fliph(image);
        }
        if options.flip_vertical.unwrap_or(false) {
            photon_rs::transform::flipv(image);
        }

        Ok(())
    }

    /// Apply color adjustments using available photon-rs functions
    fn apply_adjustments(image: &mut PhotonImage, options: &ImageProcessingOptions) -> Result<(), String> {
        if let Some(brightness) = options.brightness {
            if brightness > 1.0 {
                let adjustment = ((brightness - 1.0) * 50.0).clamp(0.0, 255.0) as u8;
                photon_rs::effects::inc_brightness(image, adjustment);
            } else if brightness < 1.0 {
                let adjustment = ((1.0 - brightness) * 50.0).clamp(0.0, 255.0) as u8;
                photon_rs::effects::dec_brightness(image, adjustment);
            }
        }

        if let Some(_contrast) = options.contrast {
            // Contrast adjustment not directly available in photon-rs
            // Could be implemented with histogram manipulation in the future
        }

        if let Some(saturation) = options.saturation {
            if saturation < 0.5 {
                // Significantly desaturate by applying grayscale
                photon_rs::monochrome::grayscale(image);
            } else if saturation < 1.0 {
                // Partially desaturate by reducing channel intensity
                let reduction = ((1.0 - saturation) * 30.0) as i16;
                photon_rs::channels::alter_red_channel(image, -reduction);
                photon_rs::channels::alter_blue_channel(image, -reduction);
            } else if saturation > 1.0 {
                // Increase saturation
                let increase = ((saturation - 1.0) * 30.0) as i16;
                photon_rs::channels::alter_red_channel(image, increase);
                photon_rs::channels::alter_blue_channel(image, increase);
            }
        }

        // Hue rotation not available in basic photon-rs

        Ok(())
    }

    /// Apply special effects
    fn apply_effects(image: &mut PhotonImage, options: &ImageProcessingOptions) -> Result<(), String> {
        let effect = options.filter.as_deref().unwrap_or("none");

        match effect {
            "edge_detection" => photon_rs::conv::edge_detection(image),
            "emboss" => photon_rs::conv::emboss(image),
            "laplace" => photon_rs::conv::laplace(image),
            "sobel_horizontal" => photon_rs::conv::sobel_horizontal(image),
            "sobel_vertical" => photon_rs::conv::sobel_vertical(image),
            "blur" => photon_rs::conv::gaussian_blur(image, 2),
            "sharpen" => photon_rs::conv::sharpen(image),
            "threshold" => {
                let threshold = (options.intensity.unwrap_or(0.5) * 255.0) as u32;
                photon_rs::monochrome::threshold(image, threshold);
            }
            "solarize" => photon_rs::effects::solarize(image),
            "posterize" => photon_rs::effects::inc_brightness(image, 20),
            _ => return Err(format!("Unknown effect: {}", effect)),
        }

        Ok(())
    }

    /// Process multiple images in batch
    pub fn process_batch(images: Vec<String>, options: &ImageProcessingOptions) -> BatchProcessingResult {
        // Note: WASM doesn't support std::time::Instant, so we'll use a placeholder for timing
        let mut results = Vec::new();
        let mut successful = 0;
        let mut failed = 0;

        for image_data in images {
            let result = Self::process_image(&image_data, options);
            if result.success {
                successful += 1;
            } else {
                failed += 1;
            }
            results.push(result);
        }

        // WASM doesn't support timing, so we'll use a placeholder
        let total_time_ms = 0u128;

        BatchProcessingResult {
            processed: results.len(),
            successful,
            failed,
            results,
            total_time_ms,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Create a simple test image as base64
    fn create_test_image_base64() -> String {
        // Create a simple 2x2 red image
        let red_pixel = [255u8, 0, 0, 255]; // RGBA red
        let mut image_data = Vec::new();
        
        // 2x2 image with all red pixels
        for _ in 0..4 {
            image_data.extend_from_slice(&red_pixel);
        }
        
        let photon_image = PhotonImage::new(image_data, 2, 2);
        
        // Convert to base64
        let bytes = ImageProcessor::photon_image_to_bytes(&photon_image, "png", None)
            .unwrap_or_else(|_| vec![137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
        ImageProcessor::bytes_to_base64_data_url(&bytes, "png")
    }

    #[test]
    fn test_base64_conversion() {
        let test_image = create_test_image_base64();
        
        // Test conversion from base64 to PhotonImage
        let photon_result = ImageProcessor::base64_to_photon_image(&test_image);
        assert!(photon_result.is_ok());
        
        let photon_image = photon_result.unwrap();
        assert_eq!(photon_image.get_width(), 2);
        assert_eq!(photon_image.get_height(), 2);
    }

    #[test]
    fn test_filter_processing() {
        let test_image = create_test_image_base64();
        let options = ImageProcessingOptions {
            operation: "filter".to_string(),
            filter: Some("grayscale".to_string()),
            intensity: Some(1.0),
            output_format: Some("png".to_string()),
            ..Default::default()
        };

        let result = ImageProcessor::process_image(&test_image, &options);
        assert!(result.success);
        assert!(result.image_data.is_some());
        assert!(result.metadata.is_some());
    }

    #[test]
    fn test_invalid_image_data() {
        let invalid_data = "invalid_base64_data";
        let options = ImageProcessingOptions {
            operation: "filter".to_string(),
            filter: Some("grayscale".to_string()),
            ..Default::default()
        };

        let result = ImageProcessor::process_image(invalid_data, &options);
        assert!(!result.success);
        assert!(result.error.is_some());
    }

    #[test]
    fn test_batch_processing() {
        let test_image = create_test_image_base64();
        let images = vec![test_image.clone(), test_image];
        let options = ImageProcessingOptions {
            operation: "filter".to_string(),
            filter: Some("sepia".to_string()),
            ..Default::default()
        };

        let result = ImageProcessor::process_batch(images, &options);
        assert_eq!(result.processed, 2);
        assert_eq!(result.successful, 2);
        assert_eq!(result.failed, 0);
    }

    #[test]
    fn test_transform_operations() {
        let test_image = create_test_image_base64();
        let options = ImageProcessingOptions {
            operation: "transform".to_string(),
            resize_width: Some(4),
            resize_height: Some(4),
            keep_aspect_ratio: Some(false),
            output_format: Some("png".to_string()),
            ..Default::default()
        };

        let result = ImageProcessor::process_image(&test_image, &options);
        assert!(result.success);
        assert!(result.metadata.is_some());
        
        if let Some(metadata) = result.metadata {
            assert_eq!(metadata.width, 4);
            assert_eq!(metadata.height, 4);
        }
    }
}

impl Default for ImageProcessingOptions {
    fn default() -> Self {
        Self {
            operation: "filter".to_string(),
            filter: None,
            intensity: None,
            brightness: None,
            contrast: None,
            saturation: None,
            hue_rotation: None,
            resize_width: None,
            resize_height: None,
            keep_aspect_ratio: None,
            crop_x: None,
            crop_y: None,
            crop_width: None,
            crop_height: None,
            rotation_angle: None,
            flip_horizontal: None,
            flip_vertical: None,
            output_format: None,
            quality: None,
            output_as_binary: None,
        }
    }
}