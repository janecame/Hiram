import { authFetch } from "./_base";

export async function uploadImage(file: File, prefix?: "items" | "ids" | "avatars"): Promise<string> {
  const presignRes = await authFetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, prefix }),
  });

  if (presignRes.status === 401) throw new Error("Authentication required");
  if (!presignRes.ok) {
    const body = (await presignRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to get upload URL");
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  // Direct S3 PUT — not our API, so this stays a plain fetch (no credentials/CSRF).
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

  return publicUrl;
}
