//! Core Rust library for n8n nodes
//! 
//! This module contains the main business logic that will be
//! exposed to JavaScript through WebAssembly bindings.

use serde::{Deserialize, Serialize};

// Image processing module
pub mod image_processor;
pub use image_processor::*;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessResult {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessOptions {
    pub format: String,
    pub validate: bool,
    pub extra_data: bool,
}

/// Main processing function - implement your core logic here
pub fn process_data(input: &str, _options: &ProcessOptions) -> ProcessResult {
    // Example implementation - replace with your actual logic
    // Note: options parameter is prefixed with _ to indicate intentional non-use in this example
    match serde_json::from_str::<serde_json::Value>(input) {
        Ok(data) => ProcessResult {
            success: true,
            data: Some(data),
            error: None,
        },
        Err(e) => ProcessResult {
            success: false,
            data: None,
            error: Some(format!("Parse error: {}", e)),
        },
    }
}

/// Batch processing function
pub fn process_batch(inputs: &[String], options: &ProcessOptions) -> Vec<ProcessResult> {
    inputs.iter()
        .map(|input| process_data(input, options))
        .collect()
}

/// Validation function
pub fn validate_input(input: &str) -> ProcessResult {
    let options = ProcessOptions {
        format: "json".to_string(),
        validate: true,
        extra_data: false,
    };
    
    process_data(input, &options)
}

// Re-export WASM module when feature is enabled
#[cfg(feature = "wasm")]
pub mod wasm;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_valid_json() {
        let input = r#"{"name": "test", "value": 42}"#;
        let options = ProcessOptions {
            format: "json".to_string(),
            validate: true,
            extra_data: false,
        };
        
        let result = process_data(input, &options);
        assert!(result.success);
        assert!(result.data.is_some());
        assert!(result.error.is_none());
    }

    #[test]
    fn test_process_invalid_json() {
        let input = r#"{"invalid": json}"#;
        let options = ProcessOptions {
            format: "json".to_string(),
            validate: true,
            extra_data: false,
        };
        
        let result = process_data(input, &options);
        assert!(!result.success);
        assert!(result.data.is_none());
        assert!(result.error.is_some());
    }

    #[test]
    fn test_validate_input() {
        let valid_input = r#"{"test": "data"}"#;
        let result = validate_input(valid_input);
        assert!(result.success);

        let invalid_input = r#"invalid json"#;
        let result = validate_input(invalid_input);
        assert!(!result.success);
    }

    #[test]
    fn test_batch_processing() {
        let inputs = vec![
            r#"{"item": 1}"#.to_string(),
            r#"{"item": 2}"#.to_string(),
            r#"invalid"#.to_string(),
        ];
        let options = ProcessOptions {
            format: "json".to_string(),
            validate: true,
            extra_data: false,
        };
        
        let results = process_batch(&inputs, &options);
        assert_eq!(results.len(), 3);
        assert!(results[0].success);
        assert!(results[1].success);
        assert!(!results[2].success);
    }
}