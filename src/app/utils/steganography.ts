/**
 * Embeds data into an image using LSB (Least Significant Bit) steganography
 * Returns the modified image data as a Blob
 */
export async function embedDataInImage(
  imageFile: File,
  data: Uint8Array
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          
          // Fill canvas with white background to handle transparency
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Check if image has transparency
          let hasAlpha = false;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 255) {
              hasAlpha = true;
              break;
            }
          }
          console.log('Embedding - Image has alpha channel:', hasAlpha);

          // Calculate maximum capacity (we can use 1 bit per color channel, excluding alpha)
          const maxBytes = Math.floor((pixels.length / 4) * 3 / 8);
          
          if (data.length > maxBytes - 4) {
            reject(new Error(`Data too large. Maximum: ${maxBytes - 4} bytes, got: ${data.length} bytes`));
            return;
          }

          // First, embed the data length (4 bytes) for extraction
          const lengthBytes = new Uint8Array(4);
          new DataView(lengthBytes.buffer).setUint32(0, data.length, false);

          const allData = new Uint8Array(lengthBytes.length + data.length);
          allData.set(lengthBytes, 0);
          allData.set(data, lengthBytes.length);

          console.log('Embedding data length:', data.length);
          console.log('Total data to embed:', allData.length);

          // Embed data into LSB of RGB channels
          let bitIndex = 0;
          for (let i = 0; i < allData.length; i++) {
            const byte = allData[i];
            for (let bit = 7; bit >= 0; bit--) {
              const pixelIndex = Math.floor(bitIndex / 3) * 4;
              const channelOffset = bitIndex % 3; // 0=R, 1=G, 2=B
              const dataIndex = pixelIndex + channelOffset;

              const bitValue = (byte >> bit) & 1;
              pixels[dataIndex] = (pixels[dataIndex] & 0xFE) | bitValue;

              bitIndex++;
            }
          }

          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Extracts hidden data from a steganographic image
 */
export async function extractDataFromImage(imageFile: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;          
          // Fill canvas with white background to handle transparency
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const pixels = imageData.data;

          // Check if image has transparency
          let hasAlpha = false;
          for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 255) {
              hasAlpha = true;
              break;
            }
          }
          console.log('Image has alpha channel:', hasAlpha);

          // Check if image has enough pixels for steganography
          const totalBits = (pixels.length / 4) * 3;
          if (totalBits < 32) { // Need at least 32 bits for length header
            reject(new Error('Image too small to contain steganographic data'));
            return;
          }

          // First, extract the data length (4 bytes)
          const lengthBytes = new Uint8Array(4);
          let bitIndex = 0;

          for (let i = 0; i < 4; i++) {
            let byte = 0;
            for (let bit = 7; bit >= 0; bit--) {
              const pixelIndex = Math.floor(bitIndex / 3) * 4;
              const channelOffset = bitIndex % 3;
              const dataIndex = pixelIndex + channelOffset;

              if (dataIndex >= pixels.length) {
                reject(new Error('Image too small to contain steganographic data'));
                return;
              }

              const bitValue = pixels[dataIndex] & 1;
              byte |= bitValue << bit;

              bitIndex++;
            }
            lengthBytes[i] = byte;
          }

          const dataLength = new DataView(lengthBytes.buffer).getUint32(0, false);

          // Validate data length
          const availableBits = totalBits - 32; // Subtract bits used for length
          const maxBytes = Math.floor(availableBits / 8);

          console.log('Extracted data length:', dataLength);
          console.log('Length bytes:', lengthBytes);
          console.log('Max bytes:', maxBytes);

          if (dataLength > maxBytes || dataLength <= 0) {
            console.log('Data length validation failed');
            reject(new Error('Invalid or corrupted steganographic data'));
            return;
          }

          // Extract the actual data
          const data = new Uint8Array(dataLength);
          for (let i = 0; i < dataLength; i++) {
            let byte = 0;
            for (let bit = 7; bit >= 0; bit--) {
              const pixelIndex = Math.floor(bitIndex / 3) * 4;
              const channelOffset = bitIndex % 3;
              const dataIndex = pixelIndex + channelOffset;

              if (dataIndex >= pixels.length) {
                reject(new Error('Image data corrupted or truncated'));
                return;
              }

              const bitValue = pixels[dataIndex] & 1;
              byte |= bitValue << bit;

              bitIndex++;
            }
            data[i] = byte;
          }

          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Validates if a file is a supported image format (PNG or BMP)
 */
export function validateImageFormat(file: File): boolean {
  const validTypes = ['image/png', 'image/bmp', 'image/x-ms-bmp'];
  return validTypes.includes(file.type);
}
