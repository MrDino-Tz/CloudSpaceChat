const CLOUD_NAME = "dt2ngt3or";
const UPLOAD_PRESET = "cloudspacechat_preset";

export async function uploadToCloudinary(file, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  if (options.folder) formData.append("folder", options.folder);
  if (options.publicId) formData.append("public_id", options.publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Upload to Cloudinary failed");
  }

  return res.json();
}

export function getOptimizedUrl(publicId, options = {}) {
  const { width = 400, height, quality = "auto", crop = "fill", format = "auto" } = options;
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;
  const transforms = [`q_${quality}`, `f_${format}`, `w_${width}`, `c_${crop}`];
  if (height) transforms.push(`h_${height}`);
  return `${base}/${transforms.join(",")}/${publicId}`;
}

export function getThumbnailUrl(publicId) {
  return getOptimizedUrl(publicId, { width: 80, height: 80, crop: "thumb" });
}
