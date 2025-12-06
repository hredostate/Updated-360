/**
 * Converts a base64 string to a Blob in a browser environment.
 * @param base64 The base64 encoded string.
 * @param mimeType The MIME type of the data.
 * @returns A Blob object.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Converts a Blob object to a base64 string.
 * @param blob The Blob to convert.
 * @returns A promise that resolves with the base64 string (without the data URL prefix).
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // result is "data:image/jpeg;base64,...."
        // We only want the part after the comma
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      } else {
        reject(new Error('Failed to read blob as a base64 string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}