//! WebAssembly bindings for the Rust core library
//! 
//! This module exposes Rust functions to JavaScript using wasm-bindgen

use wasm_bindgen::prelude::*;
use crate::{process_data, process_batch, validate_input, ProcessOptions};
use crate::image_processor::{ImageProcessor, ImageProcessingOptions};

// Enable console.error panic hook for better debugging
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Process single input - exposed to JavaScript
#[wasm_bindgen]
pub fn process_input_wasm(input: &str, options_json: &str) -> Result<String, JsValue> {
    let options: ProcessOptions = serde_json::from_str(options_json)
        .map_err(|e| JsValue::from_str(&format!("Options parse error: {}", e)))?;
    
    let result = process_data(input, &options);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
}

/// Validate input - exposed to JavaScript
#[wasm_bindgen]
pub fn validate_input_wasm(input: &str) -> Result<String, JsValue> {
    let result = validate_input(input);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
}

/// Process batch - exposed to JavaScript
#[wasm_bindgen]
pub fn process_batch_wasm(inputs_json: &str, options_json: &str) -> Result<String, JsValue> {
    let inputs: Vec<String> = serde_json::from_str(inputs_json)
        .map_err(|e| JsValue::from_str(&format!("Inputs parse error: {}", e)))?;
    
    let options: ProcessOptions = serde_json::from_str(options_json)
        .map_err(|e| JsValue::from_str(&format!("Options parse error: {}", e)))?;
    
    let results = process_batch(&inputs, &options);
    
    serde_json::to_string(&results)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
}

/// Get library version
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// Image Processing WASM Functions

/// Process a single image with the given options
#[wasm_bindgen]
pub fn process_image_wasm(base64_input: &str, options_json: &str) -> Result<String, JsValue> {
    // Wrap everything in a catch_unwind to handle panics gracefully
    let result = std::panic::catch_unwind(|| {
        // Validate inputs first
        if base64_input.is_empty() {
            return Err("Empty base64 input provided".to_string());
        }
        
        if options_json.is_empty() {
            return Err("Empty options JSON provided".to_string());
        }
        
        // Parse options with detailed error info
        let options: ImageProcessingOptions = serde_json::from_str(options_json)
            .map_err(|e| format!("Options parse error: {}. JSON: {}", e, options_json))?;
        
        // Process the image
        let result = ImageProcessor::process_image(base64_input, &options);
        
        // Serialize result
        serde_json::to_string(&result)
            .map_err(|e| format!("Serialize error: {}", e))
    });
    
    match result {
        Ok(Ok(json_string)) => Ok(json_string),
        Ok(Err(error_msg)) => {
            let error_result = serde_json::json!({
                "success": false,
                "image_data": null,
                "metadata": null,
                "error": error_msg
            });
            Ok(error_result.to_string())
        }
        Err(_panic) => {
            let panic_result = serde_json::json!({
                "success": false,
                "image_data": null,
                "metadata": null,
                "error": "Internal error: Rust code panicked during image processing"
            });
            Ok(panic_result.to_string())
        }
    }
}

/// Process multiple images in batch
#[wasm_bindgen]
pub fn process_image_batch_wasm(images_json: &str, options_json: &str) -> Result<String, JsValue> {
    let images: Vec<String> = serde_json::from_str(images_json)
        .map_err(|e| JsValue::from_str(&format!("Images parse error: {}", e)))?;
    
    let options: ImageProcessingOptions = serde_json::from_str(options_json)
        .map_err(|e| JsValue::from_str(&format!("Options parse error: {}", e)))?;
    
    let result = ImageProcessor::process_batch(images, &options);
    
    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {}", e)))
}

/// Get available filters list
#[wasm_bindgen]
pub fn get_available_filters() -> String {
    let filters = vec![
        "grayscale", "sepia", "invert", "vintage", "noir", "warm", "cool",
        "dramatic", "firenze", "golden", "lix", "lofi", "neue", "obsidian",
        "pastel_pink", "ryo"
    ];
    
    serde_json::to_string(&filters).unwrap_or_else(|_| "[]".to_string())
}

/// Get available effects list
#[wasm_bindgen]
pub fn get_available_effects() -> String {
    let effects = vec![
        "edge_detection", "emboss", "laplace", "sobel_horizontal", "sobel_vertical",
        "blur", "sharpen", "threshold", "solarize", "posterize"
    ];
    
    serde_json::to_string(&effects).unwrap_or_else(|_| "[]".to_string())
}

/// Validate image format and get metadata
#[wasm_bindgen]
pub fn validate_image_wasm(base64_input: &str) -> Result<String, JsValue> {
    match ImageProcessor::base64_to_photon_image(base64_input) {
        Ok(image) => {
            let metadata = serde_json::json!({
                "valid": true,
                "width": image.get_width(),
                "height": image.get_height(),
                "size_estimate": base64_input.len()
            });
            Ok(metadata.to_string())
        }
        Err(e) => {
            let error_result = serde_json::json!({
                "valid": false,
                "error": e
            });
            Ok(error_result.to_string())
        }
    }
}