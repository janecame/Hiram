# S3 Presigned URL Upload Strategy

A reusable pattern for uploading images/files directly from the browser to S3, without routing file bytes through your app server.

## Why

- App server never touches file bytes — no memory/bandwidth cost, no request size limits to tune.
- Upload speed is client → S3 directly (one hop, not client → server → S3).
- Server still controls **who** can upload, **what** they can upload, and **where** it lands.

## Flow

```
1. Client  -> POST /api/upload/presign  { filename, contentType, prefix }   (authenticated)
2. Server  -> validates contentType + prefix, builds a random object key,
              signs a PutObjectCommand, returns { uploadUrl, publicUrl }
3. Client  -> PUT <uploadUrl>  (raw file bytes, Content-Type header must match step 1)
4. Client  -> saves publicUrl on the parent record via your normal API
              (e.g. item.imageUrl, user.avatarUrl)
```

## Server: presign endpoint

```ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.AWS_S3_BUCKET!;
const REGION = process.env.AWS_REGION!;

export async function presign(req, res) {
  const { filename, contentType, prefix } = req.body;

  if (!filename || !contentType) {
    return res.status(400).json({ error: "filename and contentType are required" });
  }

  // Allowlist MIME types — reject everything else
  const ALLOWED_MIME = ["image/jpeg", "image/png"];
  if (!ALLOWED_MIME.includes(contentType)) {
    return res.status(400).json({ error: "Only JPEG and PNG images are allowed" });
  }

  // Allowlist destination folders — never trust a client-supplied path
  const ALLOWED_PREFIXES = ["items", "ids", "avatars"];
  const folder = ALLOWED_PREFIXES.includes(prefix) ? prefix : "items";

  // Always generate the object key server-side — never trust client filenames
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // short TTL
  const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

  res.json({ uploadUrl, publicUrl });
}
```

Mount behind auth middleware (`requireAuth`) — anyone able to request a presigned URL can write to that bucket path, so gate the endpoint, not just the bucket.

## Client: request + upload

```ts
async function uploadImage(file: File, prefix?: "items" | "ids" | "avatars"): Promise<string> {
  const token = getToken();

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename: file.name, contentType: file.type, prefix }),
  });
  if (!presignRes.ok) throw new Error("Failed to get upload URL");

  const { uploadUrl, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

  return publicUrl; // store this on the parent record
}
```

## Security checklist

- [ ] Presign endpoint requires auth (`requireAuth` or equivalent).
- [ ] `contentType` validated against an explicit allowlist — never accept arbitrary MIME types.
- [ ] Destination folder/prefix validated against an allowlist — never interpolate a client-supplied path directly.
- [ ] Object key generated server-side (`randomUUID()` + extension) — never trust the client's filename as the key.
- [ ] `expiresIn` kept short (minutes, not hours) — the signed URL is a bearer credential until it expires.
- [ ] S3 bucket policy: no public `ListBucket`; public `GetObject` only if the bucket is meant to serve public images.
- [ ] If the field is sensitive (e.g. government ID uploads), strip the resulting URL from public API reads — only owner/admin should see it.

## Prerequisites

- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` installed.
- Env vars: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`.
- IAM credentials scoped to `s3:PutObject` on the target bucket/prefix only — not full bucket access.

## Reference implementation

This pattern is implemented in Hiram at:
- `backend/src/controllers/upload.controller.ts`
- `backend/src/routes/upload.ts` (`POST /api/upload/presign`)
- `frontend/src/api/upload.ts`
