import ImageKit from "imagekit";

let imagekit: ImageKit | null = null;

function getImageKit(): ImageKit {
  if (!imagekit) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error("ImageKit credentials not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT.");
    }

    imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }
  return imagekit;
}

export function getImageKitAuthParams() {
  return getImageKit().getAuthenticationParameters();
}

export async function uploadImage(file: Buffer, fileName: string, folder?: string) {
  try {
    // Ensure folder path doesn't have leading slash to prevent double slashes
    let cleanFolder = folder || "cafe-pos";
    if (cleanFolder.startsWith('/')) {
      cleanFolder = cleanFolder.slice(1);
    }
    const response = await getImageKit().upload({
      file: file,
      fileName: fileName,
      folder: cleanFolder,
    });
    return response;
  } catch (error) {
    console.error("ImageKit upload error:", error);
    throw error;
  }
}

export async function deleteImage(fileId: string) {
  try {
    await getImageKit().deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit delete error:", error);
    throw error;
  }
}

export function getSignedUrl(filePath: string, expirySeconds: number = 3600): string {
  const ik = getImageKit();
  // Ensure the path doesn't have a leading slash since urlEndpoint already ends with /
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  return ik.url({
    path: cleanPath,
    signed: true,
    expireSeconds: expirySeconds,
  });
}

export default { getImageKitAuthParams, uploadImage, deleteImage, getSignedUrl };
