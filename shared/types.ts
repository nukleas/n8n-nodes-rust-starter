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

// Image processing types
export interface ImageProcessingOptions {
    operation: 'filter' | 'transform' | 'adjust' | 'effect';
    filter?: string;
    intensity?: number;
    brightness?: number;
    contrast?: number;
    saturation?: number;
    hue_rotation?: number;
    resize_width?: number;
    resize_height?: number;
    keep_aspect_ratio?: boolean;
    crop_x?: number;
    crop_y?: number;
    crop_width?: number;
    crop_height?: number;
    rotation_angle?: number;
    flip_horizontal?: boolean;
    flip_vertical?: boolean;
    output_format?: 'png' | 'jpeg' | 'webp';
    quality?: number;
    output_as_binary?: boolean;
}

export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
    size_bytes: number;
    processing_time_ms: number;
}

export interface ImageProcessingResult {
    success: boolean;
    image_data?: string; // base64 encoded (data URL or raw base64)
    binary_data?: number[]; // raw binary data as array of bytes
    metadata?: ImageMetadata;
    error?: string;
}

export interface BatchImageProcessingResult {
    processed: number;
    successful: number;
    failed: number;
    results: ImageProcessingResult[];
    total_time_ms: number;
}

export interface ImageValidationResult {
    valid: boolean;
    width?: number;
    height?: number;
    size_estimate?: number;
    error?: string;
}

// n8n specific types
export interface RustNodeOptions {
    outputFormat?: 'json' | 'summary' | 'raw';
    validateInput?: boolean;
    includeExtraData?: boolean;
}