import { getStore } from "@netlify/blobs";
import { json, checkAuth } from "./lib/util.mjs";

export default async (req) => {
  const store = getStore("wedding");
  if (req.method === "GET") {
    const data = await store.get("config", { type: "json" });
    return json(data || {});
  }
  if (req.method === "POST") {
    const denied = await checkAuth(req);
    if (denied) return denied;
    const text = await req.text();
    if (text.length > 200000) return json({ error: "Dữ liệu quá lớn" }, 413);
    let cfg;
    try { cfg = JSON.parse(text); } catch { return json({ error: "Dữ liệu không hợp lệ" }, 400); }
    if (!cfg || typeof cfg !== "object" || !cfg.groom || !cfg.bride) return json({ error: "Thiếu thông tin cô dâu chú rể" }, 400);
    await store.setJSON("config", cfg);
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
};

export const config = { path: "/api/config" };
