import { timingSafeEqual } from "node:crypto";

// Kiểm tra mật khẩu quản trị (biến môi trường ADMIN_PASSWORD trên Vercel).
// Trả về true nếu hợp lệ, ngược lại đã trả lỗi cho người gọi và trả về false.
export async function requireAuth(req, res) {
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!pw) {
    res.status(500).json({ error: "Chưa cài biến ADMIN_PASSWORD trên Vercel" });
    return false;
  }
  const a = Buffer.from(pw);
  const b = Buffer.from(String(req.headers["x-admin-password"] || ""));
  if (a.length === b.length && timingSafeEqual(a, b)) return true;
  await new Promise((r) => setTimeout(r, 800));
  res.status(401).json({ error: "Sai mật khẩu" });
  return false;
}

export async function readBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}
