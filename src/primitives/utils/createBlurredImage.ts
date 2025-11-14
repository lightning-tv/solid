import { type Accessor, type Resource, createResource } from 'solid-js';

/**
 * Represents a valid image source that can be used for blurring
 */
type ImageSource = string | URL;

/**
 * Represents a valid image source or null/undefined
 */
type NullableImageSource = ImageSource | null | undefined;

/**
 * Configuration options for Gaussian blur operation
 */
interface BlurOptions {
  /**
   * The blur radius in pixels
   * @default 10
   */
  readonly radius?: number;
  /**
   * CORS setting for image loading
   * @default 'anonymous'
   */
  readonly crossOrigin?: 'anonymous' | 'use-credentials' | '';
  /**
   * The resolution of the output image in pixels
   * @default 1
   */
  readonly resolution?: number;
}

/**
 * Default blur options
 */
const DEFAULT_BLUR_OPTIONS: Required<
  Pick<BlurOptions, 'radius' | 'crossOrigin' | 'resolution'>
> = {
  radius: 10,
  crossOrigin: 'anonymous',
  resolution: 1,
} as const;

/**
 * Type for Gaussian kernel array
 * Represents a normalized array of weights
 */
type GaussianKernel = readonly number[];

/**
 * Type for image dimensions
 */
interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Type for the resource return value from createBlurredImage
 */
type BlurredImageResource<T extends NullableImageSource> = Resource<
  T extends null | undefined ? null : string
>;

/**
 * Ensures a number is within valid range
 */
type ValidRadius = number & { __brand: 'ValidRadius' };

/**
 * Validates that radius is a positive number
 */
function isValidRadius(radius: number): radius is ValidRadius {
  return radius > 0 && Number.isFinite(radius);
}

/**
 * Ensures a resolution is a positive number
 */
function isValidResolution(resolution: number): boolean {
  return resolution > 0 && resolution <= 1 && Number.isFinite(resolution);
}

/**
 * Applies vertical Gaussian blur to image data
 * @param input - Input pixel data
 * @param output - Output pixel data buffer
 * @param width - Image width
 * @param height - Image height
 * @param kernel - Gaussian kernel weights
 * @param half - Half of kernel size
 */
function applyVerticalBlur(
  input: Readonly<Uint8ClampedArray>,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: Readonly<GaussianKernel>,
  half: number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let weightSum = 0;

      for (let ky = -half; ky <= half; ky++) {
        const py = y + ky;
        if (py >= 0 && py < height) {
          const pixelIndex = (py * width + x) * 4;
          const weight = kernel[ky + half]!;

          r += input[pixelIndex]! * weight;
          g += input[pixelIndex + 1]! * weight;
          b += input[pixelIndex + 2]! * weight;
          a += input[pixelIndex + 3]! * weight;
          weightSum += weight;
        }
      }

      const outputIndex = (y * width + x) * 4;
      output[outputIndex] = r / weightSum;
      output[outputIndex + 1] = g / weightSum;
      output[outputIndex + 2] = b / weightSum;
      output[outputIndex + 3] = a / weightSum;
    }
  }
}

/**
 * Applies horizontal Gaussian blur to image data
 * @param input - Input pixel data
 * @param output - Output pixel data buffer
 * @param width - Image width
 * @param height - Image height
 * @param kernel - Gaussian kernel weights
 * @param half - Half of kernel size
 */
function applyHorizontalBlur(
  input: Readonly<Uint8ClampedArray>,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: Readonly<GaussianKernel>,
  half: number,
): void {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      let weightSum = 0;

      for (let kx = -half; kx <= half; kx++) {
        const px = x + kx;
        if (px >= 0 && px < width) {
          const pixelIndex = (y * width + px) * 4;
          const weight = kernel[kx + half]!;

          r += input[pixelIndex]! * weight;
          g += input[pixelIndex + 1]! * weight;
          b += input[pixelIndex + 2]! * weight;
          a += input[pixelIndex + 3]! * weight;
          weightSum += weight;
        }
      }

      const outputIndex = (y * width + x) * 4;
      output[outputIndex] = r / weightSum;
      output[outputIndex + 1] = g / weightSum;
      output[outputIndex + 2] = b / weightSum;
      output[outputIndex + 3] = a / weightSum;
    }
  }
}

/**
 * Generates a normalized Gaussian kernel
 * @param size - Kernel size (must be odd)
 * @param sigma - Standard deviation
 * @returns Normalized Gaussian kernel
 */
function generateGaussianKernel(
  size: number,
  sigma: number,
): Readonly<GaussianKernel> {
  const kernel: number[] = [];
  const half = Math.floor(size / 2);
  let sum = 0;

  for (let i = -half; i <= half; i++) {
    const value = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel.push(value);
    sum += value;
  }

  return Object.freeze(kernel.map((value) => value / sum));
}

/**
 * Applies Gaussian blur convolution to image data
 * @param imageData - Source image data
 * @param dimensions - Image dimensions
 * @param radius - Blur radius
 * @returns Blurred image data
 */
function gaussianBlurConvolution(
  imageData: Readonly<ImageData>,
  dimensions: Readonly<ImageDimensions>,
  radius: ValidRadius,
): ImageData {
  const { data } = imageData;
  const { width, height } = dimensions;
  const output = new Uint8ClampedArray(data.length);

  const kernelSize = Math.ceil(radius * 2) * 2 + 1;
  const kernel = generateGaussianKernel(kernelSize, radius);
  const half = Math.floor(kernelSize / 2);

  applyHorizontalBlur(data, output, width, height, kernel, half);

  const tempData = new Uint8ClampedArray(output);
  applyVerticalBlur(tempData, output, width, height, kernel, half);

  return new ImageData(output, width, height);
}

/**
 * Applies Gaussian blur to an image URL
 * @param imageUrl - Image source (string or URL)
 * @param options - Blur configuration options
 * @returns Promise resolving to data URL of blurred image
 * @throws {Error} If image fails to load or blur operation fails
 */
export async function applyGaussianBlur<TSource extends ImageSource>(
  imageUrl: TSource,
  options?: Readonly<BlurOptions>,
): Promise<string> {
  const opts = { ...DEFAULT_BLUR_OPTIONS, ...options };
  const radius = opts.radius;
  const resolution = opts.resolution;

  if (!isValidRadius(radius)) {
    throw new Error(
      `Invalid blur radius: ${radius}. Must be a positive number.`,
    );
  }

  if (!isValidResolution(resolution)) {
    throw new Error(
      `Invalid resolution: ${resolution}. Must be a number between 0 and 1.`,
    );
  }

  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = opts.crossOrigin;

    img.onload = (): void => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true,
        });

        if (ctx === null) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const scaledWidth = Math.max(1, Math.round(img.width * resolution));
        const scaledHeight = Math.max(1, Math.round(img.height * resolution));

        const dimensions: ImageDimensions = {
          width: scaledWidth,
          height: scaledHeight,
        };

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const hasFilterSupport = ctx.filter !== undefined;
        if (hasFilterSupport) {
          ctx.filter = `blur(${radius}px)`;
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          ctx.filter = 'none';
        } else {
          ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          const imageData = ctx.getImageData(
            0,
            0,
            dimensions.width,
            dimensions.height,
          );
          const blurredData = gaussianBlurConvolution(
            imageData,
            dimensions,
            radius,
          );
          ctx.putImageData(blurredData, 0, 0);
        }

        const dataUrl = canvas.toDataURL();

        if (dataUrl) {
          resolve(dataUrl);
        } else {
          reject(new Error('Failed to create image data URL'));
        }
      } catch (error) {
        reject(
          error instanceof Error
            ? error
            : new Error('Unknown error during blur operation'),
        );
      }
    };

    img.onerror = (): void => {
      reject(new Error('Failed to load image'));
    };

    const srcString: string =
      typeof imageUrl === 'string' ? imageUrl : imageUrl.toString();
    img.src = srcString;
  });
}

/**
 * Hook to create a blurred image resource
 * @param imageUrl - Accessor function returning image source or null/undefined
 * @param options - Blur configuration options
 * @returns Resource containing blurred image data URL or null
 * @template TSource - Type of image source (string, URL, or null/undefined)
 *
 * @example
 * ```ts
 * const imageUrl = () => 'https://example.com/image.jpg';
 * const blurred = createBlurredImage(imageUrl, { radius: 15 });
 * ```
 */
export function createBlurredImage<TSource extends NullableImageSource>(
  imageUrl: Accessor<TSource>,
  options?: Readonly<BlurOptions>,
): BlurredImageResource<TSource> {
  const imageUrlString: Accessor<string | null | undefined> = () => {
    const url = imageUrl();
    if (url === null || url === undefined) {
      return url;
    }
    return typeof url === 'string' ? url : url.toString();
  };

  const [blurredImage] = createResource(
    imageUrlString,
    async (url: string): Promise<string> => {
      return await applyGaussianBlur(url, options);
    },
  );

  return blurredImage as BlurredImageResource<TSource>;
}
