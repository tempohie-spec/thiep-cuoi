import { put, list } from "@vercel/blob";
import { requireAuth, readBody } from "./_auth.js";

const PATH = "wedding-config.json";

// Địa chỉ file cấu hình là cố định, nên chỉ cần tra cứu (list) một lần cho mỗi lần hàm khởi động.
// Làm vậy để lượt xem của khách không tốn "advanced operations" của Vercel Blob.
let cachedUrl = null;

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Trang editor gọi kèm ?t= nên luôn lấy bản mới nhất; khách xem thiệp dùng bản cache ngắn
      const exact = new URL(req.url, "http://x").searchParams.has("t");
      let url = cachedUrl, v = "";
      if (exact || !url) {
        const { blobs } = await list({ prefix: PATH, limit: 1 });
        if (!blobs.length) {
          res.setHeader("cache-control", "no-store");
          return res.status(200).json({});
        }
        url = cachedUrl = blobs[0].url;
        v = `?v=${new Date(blobs[0].uploadedAt).getTime()}`;
      }
      const r = await fetch(url + v);
      if (!r.ok) throw new Error("blob " + r.status);
      const data = await r.json();
      res.setHeader("cache-control", exact ? "no-store" : "public, s-maxage=30, stale-while-revalidate=60");
      return res.status(200).json(data);
    } catch (e) {
      res.setHeader("cache-control", "no-store");
      return res.status(500).json({ error: "Không đọc được dữ liệu đã đăng" });
    }
  }

  if (req.method === "POST") {
    if (!(await requireAuth(req, res))) return;
    // Vercel có thể đã đọc sẵn JSON thành đối tượng; nếu chưa thì tự đọc luồng dữ liệu
    let cfg = req.body;
    try {
      if (Buffer.isBuffer(cfg)) cfg = JSON.parse(cfg.toString("utf8"));
      else if (typeof cfg === "string") cfg = JSON.parse(cfg);
      else if (!cfg || typeof cfg !== "object") cfg = JSON.parse((await readBody(req)).toString("utf8"));
    } catch { return res.status(400).json({ error: "Dữ liệu không hợp lệ" }); }
    const text = JSON.stringify(cfg);
    if (text.length > 200000) return res.status(413).json({ error: "Dữ liệu quá lớn" });
    if (!cfg || typeof cfg !== "object" || !cfg.groom || !cfg.bride) return res.status(400).json({ error: "Thiếu thông tin cô dâu chú rể" });
    const blob = await put(PATH, text, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    cachedUrl = blob.url;
    res.setHeader("cache-control", "no-store");
    return res.status(200).json({ ok: true });
  }

  res.setHeader("allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
