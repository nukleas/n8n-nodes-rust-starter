# n8n Node with Rust + WebAssembly Starter Guide

This guide explains how to create n8n community nodes that use Rust compiled to WebAssembly for high-performance computation while maintaining JavaScript compatibility.

## Overview

This approach combines:
- **Rust**: High-performance, memory-safe systems programming
- **WebAssembly (WASM)**: Portable binary format for web and Node.js
- **wasm-bindgen**: Rust-to-JavaScript bindings generator
- **n8n**: Workflow automation platform

## Benefits

- ✅ **Performance**: Near-native speed for compute-intensive tasks
- ✅ **Memory Safety**: Rust's ownership system prevents common bugs
- ✅ **Self-contained**: No external binary dependencies
- ✅ **Cross-platform**: WASM runs consistently across operating systems
- ✅ **Ecosystem**: Access to Rust's rich crate ecosystem
- ✅ **Type Safety**: Strong typing from Rust to TypeScript

## Prerequisites

### Required Tools
```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# WASM target
rustup target add wasm32-unknown-unknown

# wasm-pack (Rust to WASM compiler)
cargo install wasm-pack

# Node.js and npm
# (Download from nodejs.org or use your package manager)

# n8n CLI tools
npm install -g @n8n/node-cli
```

## Project Structure

```
my-rust-n8n-node/
├── package.json                    # n8n node package configuration
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Documentation
├── CHANGELOG.md                    # Release notes
├── rust-core/                     # Rust library source
│   ├── Cargo.toml                 # Rust dependencies and WASM config
│   ├── src/
│   │   ├── lib.rs                 # Main Rust library
│   │   └── wasm.rs                # WASM bindings (wasm-bindgen)
│   └── pkg/                       # Generated WASM output (gitignored)
└── nodes/
    └── MyNode/
        ├── MyNode.node.ts         # n8n node implementation
        ├── MyNodeWasm.ts          # WASM wrapper class
        ├── types.ts               # TypeScript interfaces
        ├── wasm/                  # WASM files (copied from rust-core/pkg)
        └── *.svg                  # Node icons
```

## Step-by-Step Implementation

### 1. Initialize n8n Node Project

```bash
# Create new n8n community node
npx @n8n/node-cli init my-rust-n8n-node
cd my-rust-n8n-node

# Remove example node if not needed
rm -rf nodes/Example
```

### 2. Create Rust Library

```bash
# Create Rust project
mkdir rust-core
cd rust-core
cargo init --lib
```

**rust-core/Cargo.toml:**
```toml
[package]
name = "my-rust-core"
version = "0.1.0"
edition = "2021"

[lib]
name = "my_rust_core"
crate-type = ["cdylib", "rlib"]

[dependencies]
# Your Rust dependencies here
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# WebAssembly dependencies (optional feature)
wasm-bindgen = { version = "0.2", optional = true }
js-sys = { version = "0.3", optional = true }
console_error_panic_hook = { version = "0.1", optional = true }

[features]
default = []
wasm = ["dep:wasm-bindgen", "dep:js-sys", "dep:console_error_panic_hook"]

# Configure wasm-pack output
[package.metadata.wasm-pack.profile.release]
wee-alloc = false
```

### 3. Implement Rust Core Logic

**rust-core/src/lib.rs:**
```rust
//! Core Rust library for n8n node
//! 
//! This module contains the main business logic that will be
//! exposed to JavaScript through WebAssembly bindings.

use serde::{Deserialize, Serialize};

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
pub fn process_data(input: &str, options: &ProcessOptions) -> ProcessResult {
    // Example implementation - replace with your actual logic
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
```

### 4. Create WebAssembly Bindings

**rust-core/src/wasm.rs:**
```rust
//! WebAssembly bindings for the Rust core library
//! 
//! This module exposes Rust functions to JavaScript using wasm-bindgen

use wasm_bindgen::prelude::*;
use crate::{process_data, process_batch, validate_input, ProcessOptions};

// Enable console.error panic hook for better debugging
#[cfg(feature = "wasm")]
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
```

### 5. Generate TypeScript Interfaces

**nodes/MyNode/types.ts:**
```typescript
// Core data structures matching Rust structs
export interface ProcessResult {
    success: boolean;
    data?: any;
    error?: string;
}

export interface ProcessOptions {
    format: string;
    validate: boolean;
    extra_data: boolean;
}

export interface BatchProcessResult {
    processed: number;
    successful: number;
    failed: number;
    results: ProcessResult[];
}

// n8n specific types
export interface MyNodeOptions {
    outputFormat?: 'json' | 'summary' | 'raw';
    validateInput?: boolean;
    includeExtraData?: boolean;
}
```

### 6. Create WASM Wrapper Class

**nodes/MyNode/MyNodeWasm.ts:**
```typescript
import { join } from 'path';
import type { ProcessResult, ProcessOptions, BatchProcessResult } from './types';

// WASM module interface
interface WasmModule {
    process_input_wasm(input: string, options: string): string;
    validate_input_wasm(input: string): string;
    process_batch_wasm(inputs: string, options: string): string;
    get_version(): string;
}

let wasmModule: WasmModule | null = null;

async function initWasm(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;
    
    try {
        // Load the Node.js compatible WASM module
        const wasmPath = join(__dirname, 'wasm', 'my_rust_core.js');
        wasmModule = require(wasmPath) as WasmModule;
        return wasmModule;
    } catch (error) {
        throw new Error(`Failed to initialize WASM module: ${error.message}`);
    }
}

export class MyNodeWasm {
    private wasmInitialized = false;
    private wasm: WasmModule | null = null;

    constructor() {
        // Constructor is synchronous, initialization happens on first use
    }

    private async ensureWasmInitialized(): Promise<void> {
        if (this.wasmInitialized && this.wasm) return;
        
        this.wasm = await initWasm();
        this.wasmInitialized = true;
    }

    async validateWasmBinary(): Promise<boolean> {
        try {
            await this.ensureWasmInitialized();
            return true;
        } catch {
            return false;
        }
    }

    async processInput(input: string, options: ProcessOptions): Promise<ProcessResult> {
        try {
            await this.ensureWasmInitialized();
            
            const optionsJson = JSON.stringify(options);
            const resultJson = this.wasm!.process_input_wasm(input, optionsJson);
            
            return JSON.parse(resultJson) as ProcessResult;
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to process input: ${error.message}`,
            };
        }
    }

    async validateInput(input: string): Promise<ProcessResult> {
        try {
            await this.ensureWasmInitialized();
            
            const resultJson = this.wasm!.validate_input_wasm(input);
            return JSON.parse(resultJson) as ProcessResult;
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to validate input: ${error.message}`,
            };
        }
    }

    async processBatch(inputs: string[], options: ProcessOptions): Promise<BatchProcessResult> {
        try {
            await this.ensureWasmInitialized();
            
            const inputsJson = JSON.stringify(inputs);
            const optionsJson = JSON.stringify(options);
            const resultsJson = this.wasm!.process_batch_wasm(inputsJson, optionsJson);
            
            const results = JSON.parse(resultsJson) as ProcessResult[];
            
            return {
                processed: results.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                results,
            };
        } catch (error: any) {
            return {
                processed: 0,
                successful: 0,
                failed: inputs.length,
                results: inputs.map(() => ({
                    success: false,
                    error: `Batch processing failed: ${error.message}`,
                })),
            };
        }
    }

    async getVersion(): Promise<string> {
        try {
            await this.ensureWasmInitialized();
            return this.wasm!.get_version();
        } catch {
            return 'unknown';
        }
    }
}
```

### 7. Implement n8n Node

**nodes/MyNode/MyNode.node.ts:**
```typescript
import type {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { MyNodeWasm } from './MyNodeWasm';
import type { MyNodeOptions, ProcessOptions } from './types';

export class MyNode implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'My Rust Node',
        name: 'myRustNode',
        icon: { light: 'file:my-node.svg', dark: 'file:my-node.dark.svg' },
        group: ['transform'],
        version: 1,
        description: 'Process data using Rust + WebAssembly',
        defaults: {
            name: 'My Rust Node',
        },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
        usableAsTool: true,
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Process Input',
                        value: 'process',
                        description: 'Process input data with Rust logic',
                        action: 'Process data using Rust',
                    },
                    {
                        name: 'Validate Input',
                        value: 'validate',
                        description: 'Validate input data format',
                        action: 'Validate input data',
                    },
                    {
                        name: 'Batch Process',
                        value: 'batch',
                        description: 'Process multiple inputs at once',
                        action: 'Batch process multiple inputs',
                    },
                ],
                default: 'process',
            },
            {
                displayName: 'Input Data',
                name: 'inputData',
                type: 'string',
                typeOptions: {
                    rows: 5,
                },
                default: '',
                placeholder: 'Enter your data here...',
                description: 'Data to process',
            },
            {
                displayName: 'Output Format',
                name: 'outputFormat',
                type: 'options',
                options: [
                    {
                        name: 'JSON',
                        value: 'json',
                        description: 'Structured JSON output',
                    },
                    {
                        name: 'Summary',
                        value: 'summary',
                        description: 'Summary information only',
                    },
                    {
                        name: 'Raw',
                        value: 'raw',
                        description: 'Raw processing result',
                    },
                ],
                default: 'json',
            },
            {
                displayName: 'Options',
                name: 'additionalOptions',
                type: 'collection',
                placeholder: 'Add Option',
                default: {},
                options: [
                    {
                        displayName: 'Validate Input',
                        name: 'validateInput',
                        type: 'boolean',
                        default: true,
                        description: 'Whether to validate input before processing',
                    },
                    {
                        displayName: 'Include Extra Data',
                        name: 'includeExtraData',
                        type: 'boolean',
                        default: false,
                        description: 'Whether to include additional metadata',
                    },
                ],
            },
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
            try {
                const operation = this.getNodeParameter('operation', itemIndex) as string;
                const inputData = this.getNodeParameter('inputData', itemIndex) as string;
                const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
                const additionalOptions = this.getNodeParameter('additionalOptions', itemIndex, {}) as any;

                const options: ProcessOptions = {
                    format: outputFormat,
                    validate: additionalOptions.validateInput ?? true,
                    extra_data: additionalOptions.includeExtraData ?? false,
                };

                const processor = new MyNodeWasm();

                // Validate WASM is available
                const wasmValid = await processor.validateWasmBinary();
                if (!wasmValid) {
                    throw new NodeOperationError(
                        this.getNode(),
                        'WASM module failed to initialize. Please check the installation.',
                    );
                }

                let result;

                switch (operation) {
                    case 'process':
                        result = await processor.processInput(inputData, options);
                        break;
                    case 'validate':
                        result = await processor.validateInput(inputData);
                        break;
                    case 'batch':
                        // For batch processing, expect JSON array of strings
                        const inputs = JSON.parse(inputData) as string[];
                        const batchResult = await processor.processBatch(inputs, options);
                        result = { success: true, data: batchResult };
                        break;
                    default:
                        throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
                }

                if (!result.success) {
                    if (this.continueOnFail()) {
                        returnData.push({
                            json: { error: result.error },
                            error: new NodeOperationError(this.getNode(), result.error || 'Unknown error'),
                            pairedItem: itemIndex,
                        });
                        continue;
                    } else {
                        throw new NodeOperationError(this.getNode(), result.error || 'Unknown error', {
                            itemIndex,
                        });
                    }
                }

                returnData.push({
                    json: result.data || result,
                    pairedItem: itemIndex,
                });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        error,
                        pairedItem: itemIndex,
                    });
                } else {
                    if (error.context) {
                        error.context.itemIndex = itemIndex;
                        throw error;
                    }
                    throw new NodeOperationError(this.getNode(), error, {
                        itemIndex,
                    });
                }
            }
        }

        return [returnData];
    }
}
```

### 8. Build Configuration

**package.json updates:**
```json
{
  "scripts": {
    "build": "npm run build-rust && n8n-node build && npm run copy-wasm",
    "build-rust": "cd rust-core && wasm-pack build --target nodejs --scope my-org --out-dir pkg-nodejs --features wasm",
    "copy-wasm": "cp -r rust-core/pkg-nodejs/* nodes/MyNode/wasm/",
    "build:watch": "tsc --watch",
    "dev": "n8n-node dev",
    "lint": "n8n-node lint",
    "lint:fix": "n8n-node lint --fix"
  },
  "files": [
    "dist"
  ]
}
```

### 9. Build Process

```bash
# Build the complete project
npm run build

# Development workflow
npm run build-rust    # Build Rust to WASM
npm run build         # Build everything
npm run dev           # Start n8n development server
```

## Best Practices

### Rust Code Organization
```rust
// Separate business logic from WASM bindings
pub mod core {
    // Your main logic here - should be WASM-agnostic
}

pub mod wasm {
    // WASM-specific bindings that call core functions
}
```

### Error Handling
```rust
// Use Result types for error handling
pub fn process_data(input: &str) -> Result<ProcessResult, ProcessError> {
    // Implementation
}

// Convert to JS-friendly errors in WASM bindings
#[wasm_bindgen]
pub fn process_wasm(input: &str) -> Result<String, JsValue> {
    match process_data(input) {
        Ok(result) => Ok(serde_json::to_string(&result)?),
        Err(e) => Err(JsValue::from_str(&e.to_string())),
    }
}
```

### Memory Management
```rust
// Use wee_alloc for smaller WASM binaries
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
```

### TypeScript Integration
```typescript
// Generate TypeScript types from Rust structs
// Use tools like typeshare or manually maintain interfaces

// Always handle WASM initialization gracefully
async function safeWasmCall<T>(
    wasmFn: () => T,
    fallback: T
): Promise<T> {
    try {
        await ensureWasmInitialized();
        return wasmFn();
    } catch (error) {
        console.warn('WASM call failed, using fallback:', error);
        return fallback;
    }
}
```

## Testing

### Rust Unit Tests
```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_data() {
        let input = r#"{"test": "data"}"#;
        let options = ProcessOptions {
            format: "json".to_string(),
            validate: true,
            extra_data: false,
        };
        
        let result = process_data(input, &options);
        assert!(result.success);
    }
}
```

### WASM Integration Tests
```bash
# Test WASM generation
cd rust-core && wasm-pack test --node

# Test n8n node
npm run build && npm run dev
```

## Performance Optimization

### Rust Optimizations
```toml
# Cargo.toml
[profile.release]
opt-level = 3
lto = true
codegen-units = 1
panic = "abort"

[profile.release.package."*"]
opt-level = 3
```

### WASM Size Optimization
```bash
# Use wee_alloc
cargo add wee_alloc

# Optimize with wasm-opt
wasm-opt --enable-mutable-globals -O4 -o optimized.wasm input.wasm
```

## Troubleshooting

### Common Issues

1. **WASM Module Not Found**
   ```bash
   # Ensure WASM files are copied correctly
   npm run copy-wasm
   ls nodes/MyNode/wasm/
   ```

2. **Type Errors**
   ```typescript
   // Ensure TypeScript interfaces match Rust structs
   // Use JSON.parse/stringify for data transfer
   ```

3. **Memory Issues**
   ```rust
   // Use Box<> for large data structures
   // Implement Drop for cleanup
   ```

4. **Build Failures**
   ```bash
   # Clear and rebuild
   cargo clean
   rm -rf rust-core/pkg*
   npm run build-rust
   ```

## Advanced Topics

### Streaming Data
```rust
// For large datasets, use streaming interfaces
#[wasm_bindgen]
pub struct DataProcessor {
    // Internal state
}

#[wasm_bindgen]
impl DataProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> DataProcessor {
        DataProcessor {}
    }
    
    pub fn process_chunk(&mut self, chunk: &str) -> Result<String, JsValue> {
        // Process data chunk by chunk
    }
}
```

### Multithreading (with SharedArrayBuffer)
```rust
// Use rayon for parallel processing
use rayon::prelude::*;

pub fn parallel_process(data: Vec<String>) -> Vec<ProcessResult> {
    data.par_iter()
        .map(|item| process_data(item, &default_options()))
        .collect()
}
```

### Custom Memory Allocators
```rust
// For specific use cases
use linked_list_allocator::LockedHeap;

#[global_allocator]
static ALLOCATOR: LockedHeap = LockedHeap::empty();
```

## Example Projects

This pattern can be used for various high-performance n8n nodes:

- **Image Processing**: Computer vision with `image` crate
- **Data Analysis**: Statistical computing with `polars` or `ndarray`
- **Cryptography**: Secure operations with `ring` or `rustcrypto`
- **Machine Learning**: AI inference with `candle` or `ort`
- **Scientific Computing**: Numerical methods with `nalgebra`
- **File Processing**: Binary format parsing (like our ZMX example)

## Resources

- [wasm-bindgen Book](https://rustwasm.github.io/wasm-bindgen/)
- [wasm-pack Documentation](https://rustwasm.github.io/wasm-pack/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Rust WASM Examples](https://github.com/rustwasm/wasm-bindgen/tree/main/examples)

## Conclusion

This Rust + WASM approach for n8n nodes provides:

- **High Performance**: Near-native execution speed
- **Memory Safety**: Rust's ownership system
- **Portability**: WASM runs everywhere Node.js does
- **Rich Ecosystem**: Access to Rust's crate ecosystem
- **Type Safety**: Strong typing from Rust through to TypeScript

The pattern scales from simple data processing to complex computational workloads while maintaining the ease of use expected in n8n workflows.