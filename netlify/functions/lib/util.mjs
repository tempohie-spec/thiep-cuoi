import { timingSafeEqual } from "node:crypto";

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

// Kiểm tra mật khẩu quản trị (biến môi trường ADMIN_PASSWORD trên Netlify)
export async function checkAuth(req) {
  const pw = process.env.ADMIN_PASSWORD || "";
  if (!pw) return json({ error: "Chưa cài biến ADMIN_PASSWORD trên Netlify" }, 500);
  const a = Buffer.from(pw);
  const b = Buffer.from(req.headers.get("x-admin-password") || "");
  if (a.length === b.length && timingSafeEqual(a, b)) return null;
  await new Promise((r) => setTimeout(r, 800));
  return json({ error: "Sai mật khẩu" }, 401);
}
