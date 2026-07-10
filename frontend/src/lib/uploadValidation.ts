const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPEG and PNG images are allowed.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}
