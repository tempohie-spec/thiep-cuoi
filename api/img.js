import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { requireAuth, readBody } from "./_auth.js";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!(await requireAuth(req, res))) return;
  const type = String(req.headers["x-image-type"] || "");
  const ext = TYPES[type];
  if (!ext) return res.status(415).json({ error: "Chỉ nhận ảnh jpg, png, webp" });
  const buf = await readBody(req);
  if (buf.length > 4 * 1024 * 1024) return res.status(413).json({ error: "Ảnh quá lớn (tối đa 4MB)" });
  const key = `wedding-images/${randomUUID().replace(/-/g, "").slice(0, 16)}.${ext}`;
  const blob = await put(key, buf, { access: "public", contentType: type, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
  res.setHeader("cache-control", "no-store");
  return res.status(200).json({ url: blob.url });
}
