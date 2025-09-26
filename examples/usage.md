# Photon Image Processor Usage Guide

This guide demonstrates how to use the Photon Image Processor node for high-performance image processing in your n8n workflows.

## Quick Start Examples

### 1. Basic Filter Application

Apply a grayscale filter to an image:

```javascript
// Node Configuration
{
  "operation": "filter",
  "filterType": "grayscale",
  "filterIntensity": 1.0,
  "outputFormat": "png",
  "outputAsBinary": true
}
```

### 2. Image Transformation

Resize an image while maintaining aspect ratio:

```javascript
// Node Configuration
{
  "operation": "transform",
  "transformOptions": {
    "resizeWidth": 800,
    "resizeHeight": 600,
    "keepAspectRatio": true
  },
  "outputFormat": "jpeg",
  "jpegQuality": 85
}
```

### 3. Color Adjustments

Enhance image brightness and contrast:

```javascript
// Node Configuration
{
  "operation": "adjust",
  "colorAdjustments": {
    "brightness": 1.2,
    "contrast": 1.1,
    "saturation": 1.1
  },
  "outputFormat": "webp"
}
```

## Input/Output Modes

### Binary Input/Output (Recommended)

Most efficient for n8n workflows:

```javascript
// Input Configuration
{
  "inputSource": "binary",
  "binaryPropertyName": "data"
}

// Output Configuration
{
  "outputAsBinary": true,
  "outputBinaryPropertyName": "processedImage"
}
```

### Base64 String Input/Output

For simple workflows or API integration:

```javascript
// Input Configuration
{
  "inputSource": "string",
  "imageData": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
}

// Output Configuration
{
  "outputAsBinary": false
}
```

## Common Workflows

### Social Media Image Pipeline

1. **HTTP Request** → Download image from URL
2. **Photon Image Processor** → Apply filter and resize
3. **Social Media Node** → Post processed image

```javascript
// Photon configuration for social media
{
  "operation": "filter",
  "filterType": "vintage",
  "filterIntensity": 0.8,
  "transformOptions": {
    "resizeWidth": 1080,
    "resizeHeight": 1080,
    "keepAspectRatio": false
  },
  "outputFormat": "jpeg",
  "jpegQuality": 90
}
```

### E-commerce Product Images

1. **File Trigger** → New product image uploaded
2. **Photon Image Processor** → Generate multiple sizes
3. **Split In Batches** → Process different formats
4. **File Save** → Save optimized versions

```javascript
// Thumbnail generation
{
  "operation": "transform",
  "transformOptions": {
    "resizeWidth": 300,
    "resizeHeight": 300,
    "keepAspectRatio": true
  },
  "outputFormat": "webp"
}
```

## Performance Tips

### Batch Processing

Process multiple images efficiently:

```javascript
{
  "batchMode": true,
  "inputSource": "string",
  "imageData": "[\"base64_image1\", \"base64_image2\", \"base64_image3\"]"
}
```

### Memory Optimization

- Use binary input/output for large images
- Choose WebP format for smaller file sizes
- Process images in batches rather than individual nodes

## Error Handling

The node provides comprehensive error handling:

```javascript
// Example error response
{
  "success": false,
  "error": "Failed to decode base64: Invalid base64 character",
  "operation": "filter",
  "itemIndex": 2
}
```

### Common Issues

1. **Invalid Base64**: Ensure proper encoding
2. **Unsupported Format**: Check input image format
3. **Memory Limits**: Process large images in smaller batches
4. **WASM Initialization**: Restart n8n if WASM fails to load

## Metadata Output

When `includeMetadata` is enabled, you get detailed processing information:

```javascript
{
  "metadata": {
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "size_bytes": 245760,
    "processing_time_ms": 0
  },
  "rust_version": "0.1.0",
  "processed_at": "2025-09-21T14:30:45.123Z"
}
```

## Advanced Examples

### Edge Detection for Document Processing

```javascript
{
  "operation": "effect",
  "effectType": "edge_detection",
  "outputFormat": "png"
}
```

### Batch Thumbnail Generation

```javascript
{
  "operation": "transform",
  "batchMode": true,
  "transformOptions": {
    "resizeWidth": 150,
    "resizeHeight": 150
  },
  "outputFormat": "webp"
}
```