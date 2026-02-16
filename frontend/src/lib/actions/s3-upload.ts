"use server";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type PresignPayload = {
  filename: string;
  contentType: string;
};

type PresignResponse = {
  uploadUrl: string;
  objectUrl: string;
};

let cachedClient: S3Client | null = null;

const getS3Client = () => {
  if (cachedClient) {
    return cachedClient;
  }

  const { MY_AWS_REGION, MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY } =
    process.env;

  if (!MY_AWS_REGION || !MY_AWS_ACCESS_KEY_ID || !MY_AWS_SECRET_ACCESS_KEY) {
    throw new Error("S3 credentials are not configured");
  }

  cachedClient = new S3Client({
    region: MY_AWS_REGION,
    credentials: {
      accessKeyId: MY_AWS_ACCESS_KEY_ID,
      secretAccessKey: MY_AWS_SECRET_ACCESS_KEY,
    },
  });

  return cachedClient;
};

export async function createPresignedS3Upload(
  payload: PresignPayload
): Promise<PresignResponse> {
  const { filename, contentType } = payload;

  if (!filename || !contentType) {
    throw new Error("Filename and content type are required");
  }

  const { S3_BUCKET, S3_PUBLIC_BASE } = process.env;

  if (!S3_BUCKET || !S3_PUBLIC_BASE) {
    throw new Error("S3 bucket configuration is missing");
  }

  const key = `help-requests/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(getS3Client(), command, {
    expiresIn: 300,
  });

  return {
    uploadUrl,
    objectUrl: `${S3_PUBLIC_BASE}/${key}`,
  };
}
