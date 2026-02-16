// src/utils/uploadToS3.ts

import { createPresignedS3Upload } from "@/lib/actions/s3-upload";

export type Uploaded = { url: string };

export async function uploadFilesToS3(files: File[]): Promise<Uploaded[]> {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const contentType = file.type || "application/octet-stream";
      const { uploadUrl, objectUrl } = await createPresignedS3Upload({
        filename: file.name.replace(/\s+/g, "_"),
        contentType,
      });

      const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file to S3");
      }

      return { url: objectUrl } satisfies Uploaded;
    })
  );

  return uploads;
}
