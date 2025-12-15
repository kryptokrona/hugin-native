/**
 * Simple image color extraction for base64 PNG images
 * Replaces react-native-image-colors (which depends on Expo)
 */

interface ColorResult {
  dominant: string;
  background: string;
  average: string;
}

interface GetColorsOptions {
  fallback?: string;
  cache?: boolean;
  key?: string;
}

// Simple cache for extracted colors
const colorCache = new Map<string, ColorResult>();

/**
 * Extract dominant color from a base64 PNG image
 * Works by sampling pixels and finding the most common non-white/black color
 */
export async function getColors(
  uri: string,
  options: GetColorsOptions = {}
): Promise<ColorResult> {
  const { fallback = '#228B22', cache = true, key } = options;
  const cacheKey = key || uri;

  // Return cached result if available
  if (cache && colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }

  try {
    // Extract base64 data
    const base64Match = uri.match(/base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid base64 image');
    }

    const base64Data = base64Match[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Parse PNG to get pixel data
    const colors = extractColorsFromPNG(bytes);
    
    if (colors.length === 0) {
      throw new Error('No colors found');
    }

    // Find dominant color (most frequent non-white/black)
    const colorCounts = new Map<string, number>();
    let totalR = 0, totalG = 0, totalB = 0, count = 0;

    for (const color of colors) {
      const hex = rgbToHex(color.r, color.g, color.b);
      
      // Skip near-white and near-black colors
      const brightness = (color.r + color.g + color.b) / 3;
      if (brightness > 240 || brightness < 15) continue;

      colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
      totalR += color.r;
      totalG += color.g;
      totalB += color.b;
      count++;
    }

    // Find most frequent color
    let dominant = fallback;
    let maxCount = 0;
    colorCounts.forEach((cnt, hex) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominant = hex;
      }
    });

    // Calculate average color
    const average = count > 0
      ? rgbToHex(Math.round(totalR / count), Math.round(totalG / count), Math.round(totalB / count))
      : fallback;

    const result: ColorResult = {
      dominant,
      background: dominant,
      average,
    };

    // Cache the result
    if (cache) {
      colorCache.set(cacheKey, result);
    }

    return result;
  } catch (error) {
    // Return fallback on error
    const result: ColorResult = {
      dominant: fallback,
      background: fallback,
      average: fallback,
    };
    return result;
  }
}

/**
 * Simple PNG parser to extract pixel colors
 * Works with uncompressed/simple PNG images like identicons
 */
function extractColorsFromPNG(data: Uint8Array): Array<{r: number, g: number, b: number}> {
  const colors: Array<{r: number, g: number, b: number}> = [];
  
  // For identicons, we can use a simpler approach:
  // Sample every Nth byte looking for RGB patterns
  // PNG header is 8 bytes, followed by chunks
  
  // Skip PNG signature (8 bytes)
  let offset = 8;
  
  while (offset < data.length - 12) {
    // Read chunk length (4 bytes, big endian)
    const chunkLength = (data[offset] << 24) | (data[offset + 1] << 16) | 
                        (data[offset + 2] << 8) | data[offset + 3];
    offset += 4;
    
    // Read chunk type (4 bytes)
    const chunkType = String.fromCharCode(data[offset], data[offset + 1], 
                                          data[offset + 2], data[offset + 3]);
    offset += 4;
    
    if (chunkType === 'PLTE') {
      // Palette chunk - extract colors
      for (let i = 0; i < chunkLength; i += 3) {
        colors.push({
          r: data[offset + i],
          g: data[offset + i + 1],
          b: data[offset + i + 2],
        });
      }
    } else if (chunkType === 'IDAT' && colors.length === 0) {
      // For non-palette images, sample raw data
      // This is a simplified approach that works for many identicons
      const sampleRate = Math.max(1, Math.floor(chunkLength / 100));
      for (let i = 0; i < chunkLength - 3; i += sampleRate * 3) {
        const r = data[offset + i];
        const g = data[offset + i + 1];
        const b = data[offset + i + 2];
        if (r !== undefined && g !== undefined && b !== undefined) {
          colors.push({ r, g, b });
        }
      }
    }
    
    // Skip chunk data + CRC (4 bytes)
    offset += chunkLength + 4;
    
    if (chunkType === 'IEND') break;
  }
  
  return colors;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Clear the color cache
 */
export function clearColorCache(): void {
  colorCache.clear();
}

