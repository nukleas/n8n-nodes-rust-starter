import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { RustWasmWrapper } from '../../shared/RustWasmWrapper';
import type { ImageProcessingOptions } from '../../shared/types';

export class PhotonImageProcessor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Photon Image Processor',
		name: 'photonImageProcessor',
		icon: 'file:photon.svg',
		group: ['transform'],
		version: 1,
		description: 'High-performance image processing using Rust + WebAssembly (photon-rs)',
		defaults: {
			name: 'Photon Image Processor',
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
						name: 'Apply Filter',
						value: 'filter',
						description: 'Apply preset filters or color effects',
						action: 'Apply image filter',
					},
					{
						name: 'Transform Image',
						value: 'transform',
						description: 'Resize, crop, rotate, or flip image',
						action: 'Transform image',
					},
					{
						name: 'Adjust Colors',
						value: 'adjust',
						description: 'Adjust brightness, contrast, saturation, and hue',
						action: 'Adjust image colors',
					},
					{
						name: 'Apply Effect',
						value: 'effect',
						description: 'Apply convolution effects and edge detection',
						action: 'Apply image effect',
					},
				],
				default: 'filter',
			},
				// Input handling
				{
					displayName: 'Input Source',
					name: 'inputSource',
					type: 'options',
					options: [
						{ name: 'String (Base64 or Data URL)', value: 'string' },
						{ name: 'Binary Property', value: 'binary' },
					],
					default: 'string',
					description: 'Choose whether to read image data from a string field or an input binary property',
				},
				{
					displayName: 'Image Data',
					name: 'imageData',
					type: 'string',
					typeOptions: {
						rows: 3,
					},
					displayOptions: {
						show: {
							inputSource: ['string'],
						},
					},
					default: '',
					placeholder: 'base64 encoded image data or expression to image field',
					description: 'Base64 encoded image data to process',
				},
				{
					displayName: 'Binary Property',
					name: 'binaryPropertyName',
					type: 'string',
					displayOptions: {
						show: {
							inputSource: ['binary'],
						},
					},
					default: 'data',
					placeholder: 'e.g. data',
					description: 'Name of the input binary property to read (expects base64 data without the data: prefix)',
				},
			// Filter options
			{
				displayName: 'Filter Type',
				name: 'filterType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['filter'],
					},
				},
				options: [
					{ name: 'Cool', value: 'cool', description: 'Cool color temperature' },
					{ name: 'Dramatic', value: 'dramatic', description: 'High contrast dramatic look' },
					{ name: 'Firenze', value: 'firenze', description: 'Firenze filter' },
					{ name: 'Golden', value: 'golden', description: 'Golden hour effect' },
					{ name: 'Grayscale', value: 'grayscale', description: 'Convert to grayscale' },
					{ name: 'Invert', value: 'invert', description: 'Invert colors' },
					{ name: 'Lix', value: 'lix', description: 'Lix filter' },
					{ name: 'Lofi', value: 'lofi', description: 'Lo-fi aesthetic' },
					{ name: 'Neue', value: 'neue', description: 'Neue filter' },
					{ name: 'Noir', value: 'noir', description: 'Film noir effect' },
					{ name: 'Obsidian', value: 'obsidian', description: 'Dark obsidian look' },
					{ name: 'Pastel Pink', value: 'pastel_pink', description: 'Soft pastel pink tones' },
					{ name: 'Ryo', value: 'ryo', description: 'Ryo filter' },
					{ name: 'Sepia', value: 'sepia', description: 'Apply sepia tone' },
					{ name: 'Vintage', value: 'vintage', description: 'Vintage film look' },
					{ name: 'Warm', value: 'warm', description: 'Warm color temperature' },
				],
				default: 'grayscale',
			},
			{
				displayName: 'Filter Intensity',
				name: 'filterIntensity',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 2,
					numberPrecision: 2,
				},
				displayOptions: {
					show: {
						operation: ['filter'],
					},
				},
				default: 1.0,
				description: 'Intensity of the filter effect (0.0 to 2.0)',
			},
			// Transform options
			{
				displayName: 'Transform Options',
				name: 'transformOptions',
				type: 'collection',
				placeholder: 'Add Transform Option',
				displayOptions: {
					show: {
						operation: ['transform'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Crop Height',
						name: 'cropHeight',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: '',
						description: 'Height of the crop area',
					},
					{
						displayName: 'Crop Width',
						name: 'cropWidth',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: '',
						description: 'Width of the crop area',
					},
					{
						displayName: 'Crop X',
						name: 'cropX',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: '',
						description: 'X coordinate for crop start position',
					},
					{
						displayName: 'Crop Y',
						name: 'cropY',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: '',
						description: 'Y coordinate for crop start position',
					},
					{
						displayName: 'Flip Horizontal',
						name: 'flipHorizontal',
						type: 'boolean',
						default: false,
						description: 'Whether to flip the image horizontally',
					},
					{
						displayName: 'Flip Vertical',
						name: 'flipVertical',
						type: 'boolean',
						default: false,
						description: 'Whether to flip the image vertically',
					},
					{
						displayName: 'Keep Aspect Ratio',
						name: 'keepAspectRatio',
						type: 'boolean',
						default: true,
						description: 'Whether to maintain the original aspect ratio when resizing',
					},
					{
						displayName: 'Resize Height',
						name: 'resizeHeight',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: '',
						description: 'New height in pixels',
					},
					{
						displayName: 'Resize Width',
						name: 'resizeWidth',
						type: 'number',
						typeOptions: {
							minValue: 1,
						},
						default: '',
						description: 'New width in pixels',
					},
					{
						displayName: 'Rotation Angle',
						name: 'rotationAngle',
						type: 'options',
						options: [
							{ name: '90°', value: 90 },
							{ name: '180°', value: 180 },
							{ name: '270°', value: 270 },
						],
						default: 90,
						description: 'Angle to rotate the image',
					},
				],
			},
			// Color adjustment options
			{
				displayName: 'Color Adjustments',
				name: 'colorAdjustments',
				type: 'collection',
				placeholder: 'Add Color Adjustment',
				displayOptions: {
					show: {
						operation: ['adjust'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Brightness',
						name: 'brightness',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 3,
							numberPrecision: 2,
						},
						default: 1.0,
						description: 'Brightness adjustment (0.0 = black, 1.0 = normal, 2.0+ = brighter)',
					},
					{
						displayName: 'Contrast',
						name: 'contrast',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 3,
							numberPrecision: 2,
						},
						default: 1.0,
						description: 'Contrast adjustment (0.0 = no contrast, 1.0 = normal, 2.0+ = higher contrast)',
					},
					{
						displayName: 'Saturation',
						name: 'saturation',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 3,
							numberPrecision: 2,
						},
						default: 1.0,
						description: 'Saturation adjustment (0.0 = grayscale, 1.0 = normal, 2.0+ = more saturated)',
					},
					{
						displayName: 'Hue Rotation',
						name: 'hueRotation',
						type: 'number',
						typeOptions: {
							minValue: -180,
							maxValue: 180,
						},
						default: 0,
						description: 'Hue rotation in degrees (-180 to 180)',
					},
				],
			},
			// Effect options
			{
				displayName: 'Effect Type',
				name: 'effectType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['effect'],
					},
				},
				options: [
					{ name: 'Blur', value: 'blur', description: 'Apply Gaussian blur' },
					{ name: 'Edge Detection', value: 'edge_detection', description: 'Detect edges in the image' },
					{ name: 'Emboss', value: 'emboss', description: 'Create embossed effect' },
					{ name: 'Laplace', value: 'laplace', description: 'Apply Laplace filter' },
					{ name: 'Posterize', value: 'posterize', description: 'Reduce color levels' },
					{ name: 'Sharpen', value: 'sharpen', description: 'Sharpen the image' },
					{ name: 'Sobel Horizontal', value: 'sobel_horizontal', description: 'Horizontal edge detection' },
					{ name: 'Sobel Vertical', value: 'sobel_vertical', description: 'Vertical edge detection' },
					{ name: 'Solarize', value: 'solarize', description: 'Solarization effect' },
					{ name: 'Threshold', value: 'threshold', description: 'Apply threshold effect' },
				],
				default: 'edge_detection',
			},
			{
				displayName: 'Effect Intensity',
				name: 'effectIntensity',
				type: 'number',
				typeOptions: {
					minValue: 0,
					maxValue: 1,
					numberPrecision: 2,
				},
				displayOptions: {
					show: {
						operation: ['effect'],
						effectType: ['threshold'],
					},
				},
				default: 0.5,
				description: 'Threshold value (0.0 to 1.0)',
			},
			// Output options
			{
				displayName: 'Output Format',
				name: 'outputFormat',
				type: 'options',
				options: [
					{ name: 'PNG', value: 'png', description: 'PNG format (lossless)' },
					{ name: 'JPEG', value: 'jpeg', description: 'JPEG format (lossy, smaller size)' },
					{ name: 'WebP', value: 'webp', description: 'WebP format (modern, efficient)' },
				],
				default: 'png',
				description: 'Output image format',
			},
				{
					displayName: 'JPEG Quality',
					name: 'jpegQuality',
					type: 'number',
					typeOptions: {
						minValue: 1,
						maxValue: 100,
					},
					displayOptions: {
						show: {
							outputFormat: ['jpeg'],
						},
					},
					default: 85,
					description: 'JPEG compression quality (1-100, higher is better quality)',
				},
				{
					displayName: 'Output As Binary',
					name: 'outputAsBinary',
					type: 'boolean',
					default: true,
					description: 'Whether to output the processed image as a binary property instead of a base64 string in JSON',
				},
				{
					displayName: 'Output Binary Property',
					name: 'outputBinaryPropertyName',
					type: 'string',
					displayOptions: {
						show: {
							outputAsBinary: [true],
						},
					},
					default: 'processedImage',
					placeholder: 'e.g. processedImage',
					description: 'Name of the binary property to write the processed image to',
				},
			{
				displayName: 'Batch Mode',
				name: 'batchMode',
				type: 'boolean',
				default: false,
				description: 'Whether to process multiple images in batch mode',
			},
			{
				displayName: 'Include Metadata',
				name: 'includeMetadata',
				type: 'boolean',
				default: true,
				description: 'Whether to include processing metadata in the output',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Initialize Rust WASM wrapper
		const rustProcessor = new RustWasmWrapper();

		// Validate WASM is available
		const wasmValid = await rustProcessor.validateWasmBinary();
		if (!wasmValid) {
			throw new NodeOperationError(
				this.getNode(),
				'Rust WASM module failed to initialize. Please ensure photon-rs dependencies are built correctly.',
			);
		}

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
					const operation = this.getNodeParameter('operation', itemIndex) as string;
					const inputSource = this.getNodeParameter('inputSource', itemIndex, 'string') as string;
					let imageData = '';
					if (inputSource === 'string') {
						imageData = this.getNodeParameter('imageData', itemIndex) as string;
					} else {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
						const item = items[itemIndex];
						if (!item.binary || !(item.binary as any)[binaryPropertyName]) {
							throw new NodeOperationError(this.getNode(), `Input binary property "${binaryPropertyName}" is missing`, { itemIndex });
						}
						const incoming = (item.binary as any)[binaryPropertyName];
						imageData = incoming.data as string; // base64 without data: prefix
					}
					const outputFormat = this.getNodeParameter('outputFormat', itemIndex) as string;
					const batchMode = this.getNodeParameter('batchMode', itemIndex, false) as boolean;
					const includeMetadata = this.getNodeParameter('includeMetadata', itemIndex, true) as boolean;
					const outputAsBinary = this.getNodeParameter('outputAsBinary', itemIndex, true) as boolean;
					const outputBinaryPropertyName = this.getNodeParameter('outputBinaryPropertyName', itemIndex, 'processedImage') as string;

				if (!imageData) {
					throw new NodeOperationError(this.getNode(), 'Image data is required', { itemIndex });
				}

				// Build processing options based on operation type
				const options: ImageProcessingOptions = {
					operation: operation as 'filter' | 'transform' | 'adjust' | 'effect',
					output_format: outputFormat as 'png' | 'jpeg' | 'webp',
				};

				// Add operation-specific parameters
				switch (operation) {
					case 'filter':
						options.filter = this.getNodeParameter('filterType', itemIndex) as string;
						options.intensity = this.getNodeParameter('filterIntensity', itemIndex, 1.0) as number;
						break;

					case 'transform':
						const transformOptions = this.getNodeParameter('transformOptions', itemIndex, {}) as any;
						if (transformOptions.resizeWidth) options.resize_width = transformOptions.resizeWidth;
						if (transformOptions.resizeHeight) options.resize_height = transformOptions.resizeHeight;
						if (transformOptions.keepAspectRatio !== undefined) options.keep_aspect_ratio = transformOptions.keepAspectRatio;
						if (transformOptions.cropX !== undefined) options.crop_x = transformOptions.cropX;
						if (transformOptions.cropY !== undefined) options.crop_y = transformOptions.cropY;
						if (transformOptions.cropWidth) options.crop_width = transformOptions.cropWidth;
						if (transformOptions.cropHeight) options.crop_height = transformOptions.cropHeight;
						if (transformOptions.rotationAngle) options.rotation_angle = transformOptions.rotationAngle;
						if (transformOptions.flipHorizontal) options.flip_horizontal = transformOptions.flipHorizontal;
						if (transformOptions.flipVertical) options.flip_vertical = transformOptions.flipVertical;
						break;

					case 'adjust':
						const colorAdjustments = this.getNodeParameter('colorAdjustments', itemIndex, {}) as any;
						if (colorAdjustments.brightness !== undefined) options.brightness = colorAdjustments.brightness;
						if (colorAdjustments.contrast !== undefined) options.contrast = colorAdjustments.contrast;
						if (colorAdjustments.saturation !== undefined) options.saturation = colorAdjustments.saturation;
						if (colorAdjustments.hueRotation !== undefined) options.hue_rotation = colorAdjustments.hueRotation;
						break;

					case 'effect':
						options.filter = this.getNodeParameter('effectType', itemIndex) as string;
						if (options.filter === 'threshold') {
							options.intensity = this.getNodeParameter('effectIntensity', itemIndex, 0.5) as number;
						}
						break;
				}

				// Add JPEG quality if applicable
				if (outputFormat === 'jpeg') {
					options.quality = this.getNodeParameter('jpegQuality', itemIndex, 85) as number;
				}

				// Set the binary output flag for Rust processing
				options.output_as_binary = outputAsBinary;

				let result: any;

					if (batchMode) {
						if (inputSource === 'binary') {
							throw new NodeOperationError(this.getNode(), 'Batch mode with binary input is not supported. Provide a JSON array of base64 strings for batch processing.', { itemIndex });
						}
						// Parse image data as array for batch processing
						const imageArray = JSON.parse(imageData) as string[];
						const batchResult = await rustProcessor.processImageBatch(imageArray, options);
					
					if (batchResult.failed > 0) {
						if (this.continueOnFail()) {
							result = {
								success: false,
								error: `Batch processing completed with ${batchResult.failed} failures`,
								batch_result: batchResult,
							};
						} else {
							throw new NodeOperationError(
								this.getNode(),
								`Batch processing failed for ${batchResult.failed} out of ${batchResult.processed} images`,
								{ itemIndex }
							);
						}
					} else {
						result = {
							success: true,
							batch_result: batchResult,
						};
					}
				} else {
					// Single image processing
					result = await rustProcessor.processImage(imageData, options);
				}

				if (!result.success) {
					if (this.continueOnFail()) {
						returnData.push({
							json: {
								error: result.error,
								operation,
								itemIndex,
							},
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

					// Prepare output data
					const outputData: any = {
						operation,
						success: true,
					};

					if (includeMetadata) {
						if (result.metadata) {
							outputData.metadata = result.metadata;
						} else if ((result as any).batch_result) {
							outputData.metadata = {
								batch_info: (result as any).batch_result,
								processing_time_ms: (result as any).batch_result.total_time_ms,
							};
						}
						outputData.rust_version = await rustProcessor.getVersion();
						outputData.processed_at = new Date().toISOString();
					}

					const newItem: INodeExecutionData = {
						json: outputData,
						pairedItem: itemIndex,
					};

					if (outputAsBinary && !batchMode) {
						// Check if we have binary_data from Rust (more efficient)
						let dataBase64: string;
						let mimeType = `image/${outputFormat}`;
						
						if (result.binary_data && Array.isArray(result.binary_data)) {
							// Convert array of bytes to base64 string
							const uint8Array = new Uint8Array(result.binary_data);
							dataBase64 = Buffer.from(uint8Array).toString('base64');
						} else if (result.image_data) {
							// Fallback to parsing from data URL or assuming it's already base64
							const processedDataUrl = result.image_data as string;
							const match = processedDataUrl?.match(/^data:(.+?);base64,(.*)$/);
							if (match) {
								mimeType = match[1];
								dataBase64 = match[2];
							} else {
								// Assume it's already base64
								dataBase64 = processedDataUrl;
							}
						} else {
							throw new NodeOperationError(this.getNode(), 'No image data available from processing result', { itemIndex });
						}

						const extMap: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' };
						const fileExtension = extMap[mimeType] || outputFormat;
						let fileName = `processed.${fileExtension}`;
						if (inputSource === 'binary') {
							const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
							const src = (items[itemIndex].binary as any)?.[binaryPropertyName];
							if (src?.fileName) {
								const base = (src.fileName as string).replace(/\.[^.]+$/, '');
								fileName = `${base}-processed.${fileExtension}`;
							}
						}

						newItem.binary = newItem.binary || {};
						(newItem.binary as any)[outputBinaryPropertyName] = {
							data: dataBase64,
							fileName,
							fileExtension,
							mimeType,
						};
					} else {
						(newItem.json as any).processed_image = result.image_data || (result as any).batch_result;
					}

					returnData.push(newItem);

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
							itemIndex,
						},
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
