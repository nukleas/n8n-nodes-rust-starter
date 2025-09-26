import { join } from 'path';
import type { 
    ProcessResult, 
    ProcessOptions, 
    BatchProcessResult,
    ImageProcessingOptions,
    ImageProcessingResult,
    BatchImageProcessingResult,
    ImageValidationResult
} from './types';

// WASM module interface
interface WasmModule {
    process_input_wasm(input: string, options: string): string;
    validate_input_wasm(input: string): string;
    process_batch_wasm(inputs: string, options: string): string;
    get_version(): string;
    
    // Image processing functions
    process_image_wasm(base64_input: string, options_json: string): string;
    process_image_batch_wasm(images_json: string, options_json: string): string;
    get_available_filters(): string;
    get_available_effects(): string;
    validate_image_wasm(base64_input: string): string;
}

let wasmModule: WasmModule | null = null;

async function initWasm(): Promise<WasmModule> {
    if (wasmModule) return wasmModule;
    
    try {
        // Load the Node.js compatible WASM module
        const wasmPath = join(__dirname, '..', 'wasm', 'n8n_rust_core.js');
        wasmModule = require(wasmPath) as WasmModule;
        return wasmModule;
    } catch (error) {
        throw new Error(`Failed to initialize WASM module: ${error.message}`);
    }
}

export class RustWasmWrapper {
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

    // Image processing methods
    async processImage(base64Input: string, options: ImageProcessingOptions): Promise<ImageProcessingResult> {
        try {
            await this.ensureWasmInitialized();
            
            const optionsJson = JSON.stringify(options);
            const resultJson = this.wasm!.process_image_wasm(base64Input, optionsJson);
            
            const result = JSON.parse(resultJson) as ImageProcessingResult;
            
            // Convert binary_data from Rust Vec<u8> to proper Uint8Array if present
            if (result.binary_data && Array.isArray(result.binary_data)) {
                // Keep it as array for n8n binary property compatibility
                result.binary_data = result.binary_data;
            }
            
            return result;
        } catch (error: any) {
            return {
                success: false,
                error: `Failed to process image: ${error.message}`,
            };
        }
    }

    async processImageBatch(images: string[], options: ImageProcessingOptions): Promise<BatchImageProcessingResult> {
        try {
            await this.ensureWasmInitialized();
            
            const imagesJson = JSON.stringify(images);
            const optionsJson = JSON.stringify(options);
            const resultJson = this.wasm!.process_image_batch_wasm(imagesJson, optionsJson);
            
            return JSON.parse(resultJson) as BatchImageProcessingResult;
        } catch (error: any) {
            return {
                processed: 0,
                successful: 0,
                failed: images.length,
                results: images.map(() => ({
                    success: false,
                    error: `Batch processing failed: ${error.message}`,
                })),
                total_time_ms: 0,
            };
        }
    }

    async validateImage(base64Input: string): Promise<ImageValidationResult> {
        try {
            await this.ensureWasmInitialized();
            
            const resultJson = this.wasm!.validate_image_wasm(base64Input);
            return JSON.parse(resultJson) as ImageValidationResult;
        } catch (error: any) {
            return {
                valid: false,
                error: `Failed to validate image: ${error.message}`,
            };
        }
    }

    async getAvailableFilters(): Promise<string[]> {
        try {
            await this.ensureWasmInitialized();
            
            const filtersJson = this.wasm!.get_available_filters();
            return JSON.parse(filtersJson) as string[];
        } catch {
            return [];
        }
    }

    async getAvailableEffects(): Promise<string[]> {
        try {
            await this.ensureWasmInitialized();
            
            const effectsJson = this.wasm!.get_available_effects();
            return JSON.parse(effectsJson) as string[];
        } catch {
            return [];
        }
    }
}