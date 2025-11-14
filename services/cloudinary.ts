/**
 * Cloudinary service for uploading images
 * 
 * Configuration:
 * - EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET: Your upload preset (unsigned recommended for mobile)
 */

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface UploadResult {
  url: string;
  publicId: string;
  secureUrl: string;
}

/**
 * Uploads an image to Cloudinary
 * @param imageUri - Local URI of the image to upload
 * @param folder - Optional folder path in Cloudinary (e.g., 'reports')
 * @returns Promise with the uploaded image URL
 */
export async function uploadImageToCloudinary(
  imageUri: string,
  folder?: string
): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary configuration is missing. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  if (folder) {
    formData.append('folder', folder);
  }

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with the correct boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudinary upload failed: ${errorText}`);
    }

    const data = await response.json();
    
    return {
      url: data.secure_url || data.url,
      publicId: data.public_id,
      secureUrl: data.secure_url,
    };
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Uploads multiple images to Cloudinary
 * @param imageUris - Array of local URIs to upload
 * @param folder - Optional folder path in Cloudinary
 * @returns Promise with array of uploaded image URLs
 */
export async function uploadImagesToCloudinary(
  imageUris: string[],
  folder?: string
): Promise<string[]> {
  const uploadPromises = imageUris.map(uri => 
    uploadImageToCloudinary(uri, folder)
  );
  
  const results = await Promise.all(uploadPromises);
  return results.map(result => result.secureUrl);
}

