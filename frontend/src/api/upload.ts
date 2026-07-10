import { API_BASE } from "./_base";

function getToken(): string | null {
  return localStorage.getItem("hiram_token");
}

export async function uploadImage(file: File, prefix?: "items" | "ids" | "avatars"): Promise<string> {
  const token = getToken();
  if (!token) throw new Error("Authentication required");

  const presignRes = await fetch(`${API_BASE}/api/upload/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ filename: file.name, contentType: file.type, prefix }),
  });

  if (!presignRes.ok) {
    const body = (await presignRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Failed to get upload URL");
  }

  const { uploadUrl, publicUrl } = (await presignRes.json()) as {
    uploadUrl: string;
    publicUrl: string;
  };

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to S3");

  return publicUrl;
}
