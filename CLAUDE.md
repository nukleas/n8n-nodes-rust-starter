# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node starter project with integrated Rust + WebAssembly capabilities. The project allows building high-performance n8n nodes using Rust for compute-intensive operations while maintaining JavaScript/TypeScript compatibility for n8n integration.

## Architecture

### Core Components

- **src-rust/**: Rust source code that compiles to WebAssembly
  - `lib.rs`: Main Rust business logic (WASM-agnostic)
  - `wasm.rs`: WebAssembly bindings using wasm-bindgen
  - `Cargo.toml`: Rust dependencies and WASM build configuration

- **shared/**: TypeScript interfaces and utilities for Rust interop
  - `types.ts`: TypeScript interfaces matching Rust structs
  - `RustWasmWrapper.ts`: High-level wrapper for WASM module interaction

- **nodes/**: n8n node implementations
  - Example nodes demonstrate TypeScript + WASM integration patterns

- **dist/wasm/**: Generated WASM files (created during build, not in git)

### Data Flow

1. n8n node receives user input via TypeScript
2. TypeScript calls RustWasmWrapper methods
3. RustWasmWrapper serializes data to JSON and calls WASM functions
4. Rust processes data and returns JSON results
5. TypeScript deserializes and returns results to n8n

## Essential Commands

### Development Workflow
```bash
# Install dependencies
npm install

# Build Rust to WASM
npm run build-rust

# Build complete project
npm run build

# Development with auto-rebuild
npm run dev

# Rust development (build + copy WASM)
npm run dev-rust

# Test Rust code
npm run test-rust
```

### Build Process
```bash
# Full build (includes Rust compilation)
npm run build

# Individual steps:
npm run build-rust    # Compile Rust to WASM
npm run copy-wasm     # Copy WASM files to dist/
```

### Linting and Formatting
```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lintfix

# Format TypeScript/JavaScript
npm run format
```

## Rust Development Guidelines

### Prerequisites
Ensure these tools are installed:
```bash
# Rust toolchain
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# WASM target
rustup target add wasm32-unknown-unknown

# wasm-pack
cargo install wasm-pack
```

### Code Organization

**Core Logic** (`src-rust/src/lib.rs`):
- Keep business logic WASM-agnostic
- Use standard Rust types and patterns
- Export functions that wasm.rs can call

**WASM Bindings** (`src-rust/src/wasm.rs`):
- Handle JavaScript↔Rust data conversion
- Use `serde_json` for complex data structures
- Implement proper error handling with `JsValue`

### TypeScript Integration

**Type Safety**:
- Maintain matching interfaces in `shared/types.ts`
- Use JSON serialization for data transfer
- Handle WASM initialization gracefully

**Error Handling**:
- Always handle WASM module loading failures
- Provide fallback behaviors when WASM is unavailable
- Use ProcessResult pattern for consistent error reporting

## n8n Node Development

### Node Structure
Follow the established pattern:
1. Import shared types and RustWasmWrapper
2. Define INodeTypeDescription with proper parameters
3. Implement execute() method with error handling
4. Use pairedItem for proper data flow tracking

### Common Patterns
```typescript
// Initialize WASM wrapper
const processor = new RustWasmWrapper();

// Validate WASM availability
const wasmValid = await processor.validateWasmBinary();
if (!wasmValid) {
    throw new NodeOperationError(this.getNode(), 'WASM module failed to initialize');
}

// Process data with proper error handling
const result = await processor.processInput(inputData, options);
if (!result.success) {
    // Handle errors based on continueOnFail() setting
}
```

## Build Configuration

### WASM Compilation
The project uses wasm-pack with these settings:
- Target: `nodejs` (for Node.js compatibility)
- Features: `wasm` (enables WebAssembly-specific dependencies)
- Output: `src-rust/pkg/` (copied to `dist/wasm/` for distribution)

### Package.json Integration
The build process is integrated into npm scripts:
- `build-rust`: Compiles Rust to WASM
- `copy-wasm`: Copies WASM files to distribution directory
- `build`: Full build including TypeScript compilation and WASM

## Testing Strategy

### Rust Tests
```bash
cd src-rust && cargo test
```
- Unit tests for core logic in lib.rs
- Integration tests for WASM bindings

### n8n Integration Tests
Use n8n's development environment:
```bash
npm run dev
# Then test in n8n instance
```

## Performance Considerations

### WASM Optimization
- Use `wasm-pack` release builds for production
- Consider `wee_alloc` for smaller binary size
- Profile memory usage for large datasets

### Data Transfer
- Minimize JSON serialization overhead
- Use streaming for large datasets when possible
- Cache WASM module initialization

## Common Issues and Solutions

### WASM Module Not Found
```bash
# Ensure WASM files are built and copied
npm run build-rust
npm run copy-wasm
ls dist/wasm/  # Should contain .js and .wasm files
```

### Type Mismatches
- Verify TypeScript interfaces match Rust structs exactly
- Check JSON serialization/deserialization logic
- Use `serde(rename_all = "camelCase")` for JavaScript compatibility

### Build Failures
```bash
# Clean and rebuild
cd src-rust && cargo clean
rm -rf src-rust/pkg dist/wasm
npm run build-rust
```

## Deployment Notes

### Package Distribution
- WASM files are included in npm package via `files` field
- Ensure `dist/wasm/` is properly populated before publishing
- Test package installation in clean environment

### Runtime Requirements
- Node.js >= 20.15 (as specified in engines)
- No additional native dependencies required
- WASM runs in n8n's existing Node.js environment