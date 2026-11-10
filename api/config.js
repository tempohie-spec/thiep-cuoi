import { put, list } from "@vercel/blob";
import { requireAuth, readBody } from "./_auth.js";

const PATH = "wedding-config.json";

// File cấu hình luôn có tên cố định (không đuôi ngẫu nhiên) nên địa chỉ công khai của nó đoán được:
//   https://<mã kho>.public.blob.vercel-storage.com/wedding-config.json
// Mã kho nằm trong khóa BLOB_READ_WRITE_TOKEN (dạng vercel_blob_rw_<mã kho>_<bí mật>). Tải thẳng địa chỉ này không cần list(),
// nên lượt xem thiệp và mở editor không tốn "advanced operations" của Vercel Blob.
function publicBase() {
  if (process.env.BLOB_PUBLIC_BASE) return process.env.BLOB_PUBLIC_BASE.replace(/\/+$/, "");
  const m = /^vercel_blob_rw_([A-Za-z0-9]+)_/.exec(process.env.BLOB_READ_WRITE_TOKEN || "");
  return m ? `https://${m[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

// Dự phòng: nếu tải thẳng không được thì tra cứu bằng list() (tốn 1 thao tác nâng cao) rồi nhớ địa chỉ tìm được
let listedUrl = null;
async function readViaList(bust) {
  if (!listedUrl || bust) {
    const { blobs } = await list({ prefix: PATH, limit: 1 });
    if (!blobs.length) return null;
    listedUrl = blobs[0].url + `?v=${new Date(blobs[0].uploadedAt).getTime()}`;
  }
  const r = await fetch(listedUrl);
  if (!r.ok) throw new Error("blob " + r.status);
  return r.json();
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // Trang editor gọi kèm ?t= nên luôn lấy bản mới nhất; khách xem thiệp dùng bản lưu tạm ngắn
      const exact = new URL(req.url, "http://x").searchParams.has("t");
      let data = null, got = false;
      const base = publicBase();
      if (base) {
        try {
          const r = await fetch(`${base}/${PATH}` + (exact ? `?t=${Date.now()}` : ""));
          if (r.ok) { data = await r.json(); got = true; }
        } catch {}
      }
      if (!got) data = await readViaList(exact);
      res.setHeader("cache-control", data ? (exact ? "no-store" : "public, s-maxage=30, stale-while-revalidate=60") : "no-store");
      return res.status(200).json(data || {});
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
    listedUrl = null;
    res.setHeader("cache-control", "no-store");
    return res.status(200).json({ ok: true });
  }

  res.setHeader("allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
