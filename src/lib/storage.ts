import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

export interface StorageUploadInput {
  file: File;
  folder?: string;
}

export interface StorageUploadResult {
  key: string;
  mediaType: "image" | "video";
  secureUrl: string;
}

export interface StorageProvider {
  id: "cloudinary";
  upload: (input: StorageUploadInput) => Promise<StorageUploadResult>;
  getPublicUrl: (key: string, mediaType?: string | null) => string;
}

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables");
  }

  return { cloudName, apiKey, apiSecret };
}

function inferMediaType(file: File) {
  if (file.type.startsWith("video/")) {
    return "video" as const;
  }

  return "image" as const;
}

async function fileToDataUri(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  return `data:${file.type};base64,${base64}`;
}

export const cloudinaryStorageProvider: StorageProvider = {
  id: "cloudinary",
  async upload({ file, folder }) {
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const mediaType = inferMediaType(file);

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const result = (await cloudinary.uploader.upload(await fileToDataUri(file), {
      folder,
      resource_type: mediaType,
    })) as UploadApiResponse;

    return {
      key: result.public_id,
      mediaType,
      secureUrl: result.secure_url,
    };
  },
  getPublicUrl(key, mediaType = "image") {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      return "";
    }

    const resourceType = mediaType === "video" ? "video" : "image";
    return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${key}`;
  },
};

export function getStorageProvider(provider: string | null = "cloudinary") {
  if (!provider || provider === "cloudinary") {
    return cloudinaryStorageProvider;
  }

  throw new Error(`Unsupported storage provider: ${provider}`);
}
