# 📸 n8n Photon Image Processor

[![npm version](https://badge.fury.io/js/n8n-nodes-photon-image-processor.svg)](https://badge.fury.io/js/n8n-nodes-photon-image-processor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

High-performance image processing node for [n8n](https://n8n.io) powered by Rust/WebAssembly and [photon-rs](https://github.com/silvia-odwyer/photon). Transform, filter, and manipulate images with blazing-fast performance directly in your n8n workflows.

## ✨ Features

### 🎨 **Image Operations**
- **Filters**: Grayscale, Sepia, Vintage, Noir, Dramatic, Cool/Warm tones, and more
- **Transformations**: Resize, Crop, Rotate, Flip with aspect ratio preservation
- **Color Adjustments**: Brightness, Contrast, Saturation, Hue rotation
- **Effects**: Edge detection, Emboss, Blur, Sharpen, Threshold, Solarize

### 🚀 **Performance & Output**
- **Rust-powered**: Leverages WebAssembly for near-native performance
- **Dual output modes**: Base64 data URLs or binary output for optimal n8n integration
- **Batch processing**: Process multiple images in a single operation
- **Format support**: PNG, JPEG, WebP with quality control

### 🔧 **Developer Experience**
- **Type-safe**: Full TypeScript support with comprehensive interfaces
- **Memory efficient**: Optimized binary handling and WASM integration
- **Extensible**: Clean architecture for adding new image operations

## 📦 Installation

```bash
# Install globally for n8n
npm install -g n8n-nodes-photon-image-processor

# Or in your n8n project
npm install n8n-nodes-photon-image-processor
```

### Prerequisites

- Node.js >= 20.15
- n8n >= 1.0.0

## 🚀 Quick Start

1. **Install the node** in your n8n instance
2. **Add the Photon Image Processor** node to your workflow
3. **Configure your operation**:
   - Choose operation type (Filter, Transform, Adjust, Effect)
   - Select specific options for your chosen operation
   - Configure input/output format preferences

### Example Workflow

```javascript
// Apply a vintage filter to an image
{
  "operation": "filter",
  "filter": "vintage",
  "intensity": 1.2,
  "output_format": "jpeg",
  "quality": 85,
  "outputAsBinary": true
}
```

## 🎯 Use Cases

- **Social Media Automation**: Apply consistent filters to images before posting
- **E-commerce**: Resize and optimize product images for different platforms
- **Content Pipelines**: Batch process images with consistent styling
- **Data Processing**: Extract information using edge detection and effects
- **API Workflows**: Transform images in response to webhook triggers

## 🔧 Configuration Options

### Operations

| Operation | Description | Available Options |
|-----------|-------------|-------------------|
| **Filter** | Apply artistic filters | Grayscale, Sepia, Vintage, Noir, Dramatic, Cool, Warm, Firenze, Golden, Lix, Lofi, Neue, Obsidian, Pastel Pink, Ryo |
| **Transform** | Resize, crop, rotate | Width/Height, Aspect ratio, Crop coordinates, Rotation angles, Flip options |
| **Adjust** | Color corrections | Brightness, Contrast, Saturation, Hue rotation |
| **Effect** | Special effects | Edge detection, Emboss, Laplace, Sobel, Blur, Sharpen, Threshold, Solarize, Posterize |

### Input/Output

- **Input Sources**: Base64 strings, Data URLs, Binary properties
- **Output Formats**: PNG (lossless), JPEG (configurable quality), WebP
- **Output Modes**: Binary properties (efficient) or JSON with base64 data

## 🏗️ Development

This project demonstrates advanced n8n node development with Rust/WebAssembly integration.

### Architecture

```
├── nodes/PhotonImageProcessor/     # n8n node implementation
├── src-rust/                      # Rust + WASM source
│   ├── src/lib.rs                 # Core Rust logic
│   ├── src/wasm.rs               # WebAssembly bindings
│   └── src/image_processor.rs    # Image processing implementation
├── shared/                        # TypeScript interfaces
│   ├── types.ts                  # Shared type definitions
│   └── RustWasmWrapper.ts        # WASM integration layer
└── dist/                         # Compiled output
```

### Build Process

```bash
# Development setup
pnpm install

# Build Rust to WASM
pnpm run build-rust

# Build complete project
pnpm run build

# Run tests
pnpm run test-rust
pnpm run lint
```

### Key Technologies

- **[photon-rs](https://github.com/silvia-odwyer/photon)**: High-performance image processing library
- **[wasm-bindgen](https://github.com/rustwasm/wasm-bindgen)**: Rust-WASM-JavaScript integration
- **[image-rs](https://github.com/image-rs/image)**: Rust image encoding/decoding
- **TypeScript**: Type-safe n8n integration

## 📊 Performance

The Rust/WebAssembly implementation provides significant performance benefits:

- **Filter operations**: ~10-50x faster than pure JavaScript
- **Image transformations**: ~5-20x performance improvement
- **Memory efficiency**: Reduced garbage collection pressure
- **Batch processing**: Linear scaling with optimized memory usage

## 🤝 Contributing

Contributions are welcome! This project serves as a template for building high-performance n8n nodes with Rust.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test-rust && pnpm lint`
5. Submit a pull request

### Adding New Operations

1. **Rust side**: Add functions to `src-rust/src/image_processor.rs`
2. **WASM bindings**: Export in `src-rust/src/wasm.rs`
3. **TypeScript**: Update interfaces in `shared/types.ts`
4. **n8n node**: Add UI options in `nodes/PhotonImageProcessor/`

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md) for details.

## 🙏 Acknowledgments

- [photon-rs](https://github.com/silvia-odwyer/photon) by Silvia O'Dwyer
- [n8n](https://n8n.io) community for the amazing automation platform
- Rust and WebAssembly communities for excellent tooling

## 🔗 Links

- [n8n Documentation](https://docs.n8n.io/)
- [photon-rs Documentation](https://docs.rs/photon-rs/)
- [WebAssembly](https://webassembly.org/)
- [Report Issues](https://github.com/naderheidari/n8n-nodes-photon-image-processor/issues)

---

**Built with ❤️ using Rust, WebAssembly, and n8n**
