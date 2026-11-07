import { getStore } from "@netlify/blobs";
import { json, checkAuth } from "./lib/util.mjs";

const TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export default async (req) => {
  const store = getStore("wedding-images");
  const url = new URL(req.url);

  if (req.method === "GET") {
    const key = decodeURIComponent(url.pathname.replace(/^\/api\/img\//, ""));
    if (!/^[a-z0-9-]{8,40}\.(jpg|png|webp)$/.test(key)) return new Response("Not found", { status: 404 });
    const res = await store.getWithMetadata(key, { type: "arrayBuffer" });
    if (!res) return new Response("Not found", { status: 404 });
    return new Response(res.data, {
      headers: {
        "content-type": res.metadata?.contentType || "image/jpeg",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  }

  if (req.method === "POST") {
    const denied = await checkAuth(req);
    if (denied) return denied;
    const type = (req.headers.get("content-type") || "").split(";")[0];
    const ext = TYPES[type];
    if (!ext) return json({ error: "Chỉ nhận ảnh jpg, png, webp" }, 415);
    const buf = await req.arrayBuffer();
    if (buf.byteLength > 5.5 * 1024 * 1024) return json({ error: "Ảnh quá lớn" }, 413);
    const key = crypto.randomUUID().replace(/-/g, "").slice(0, 16) + "." + ext;
    await store.set(key, buf, { metadata: { contentType: type } });
    return json({ url: "/api/img/" + key });
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: ["/api/img", "/api/img/*"] };
