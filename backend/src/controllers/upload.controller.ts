import type { Request, Response } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env["AWS_REGION"]!,
  credentials: {
    accessKeyId: process.env["AWS_ACCESS_KEY_ID"]!,
    secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"]!,
  },
});

const BUCKET = process.env["AWS_S3_BUCKET"]!;
const REGION = process.env["AWS_REGION"]!;

export const UploadController = {
  async presign(req: Request, res: Response): Promise<void> {
    const { filename, contentType, prefix } = req.body as {
      filename?: string;
      contentType?: string;
      prefix?: string;
    };

    if (!filename || !contentType) {
      res.status(400).json({ error: "filename and contentType are required" });
      return;
    }

    const ALLOWED_MIME = ["image/jpeg", "image/png"];
    if (!ALLOWED_MIME.includes(contentType)) {
      res.status(400).json({ error: "Only JPEG and PNG images are allowed" });
      return;
    }

    const ALLOWED_PREFIXES = ["items", "ids", "avatars"] as const;
    const folder = ALLOWED_PREFIXES.includes(prefix as typeof ALLOWED_PREFIXES[number])
      ? prefix
      : "items";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const key = `${folder}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    res.json({ uploadUrl, publicUrl });
  },
};
