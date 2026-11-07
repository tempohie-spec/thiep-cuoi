import { put, list } from "@vercel/blob";
import { requireAuth, readBody } from "./_auth.js";

const PATH = "wedding-config.json";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { blobs } = await list({ prefix: PATH, limit: 1 });
      if (!blobs.length) {
        res.setHeader("cache-control", "no-store");
        return res.status(200).json({});
      }
      // Thêm mốc thời gian để luôn lấy bản mới nhất, không dính cache của CDN
      const v = new Date(blobs[0].uploadedAt).getTime();
      const r = await fetch(`${blobs[0].url}?v=${v}`);
      if (!r.ok) throw new Error("blob " + r.status);
      const data = await r.json();
      // Khách xem thiệp được cache ngắn để tiết kiệm lượt gọi; trang editor gọi kèm ?t= nên luôn lấy mới
      res.setHeader("cache-control", "public, s-maxage=30, stale-while-revalidate=60");
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
    await put(PATH, text, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 60,
    });
    res.setHeader("cache-control", "no-store");
    return res.status(200).json({ ok: true });
  }

  res.setHeader("allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
