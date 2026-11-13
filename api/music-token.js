import { handleUpload } from "@vercel/blob/client";
import { passwordOk } from "./_auth.js";

// Cấp "vé" để trình duyệt tải thẳng file nhạc lên Vercel Blob (không qua hàm này nên không bị giới hạn 4,5MB).
// Chỉ cấp khi có đúng mật khẩu quản trị.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const json = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!process.env.ADMIN_PASSWORD) throw new Error("Chưa cài biến ADMIN_PASSWORD trên Vercel");
        if (!passwordOk(clientPayload)) {
          await new Promise((r) => setTimeout(r, 800));
          throw new Error("Sai mật khẩu");
        }
        if (!/^(music|cover)\/[A-Za-z0-9._-]{1,100}$/.test(pathname)) throw new Error("Tên file không hợp lệ");
        // nhạc nền (thư mục music/) hoặc hình động của ảnh bìa (thư mục cover/: MP4, WebM, GIF)
        const kinds = pathname.startsWith("cover/")
          ? ["video/mp4", "video/webm", "image/gif"]
          : ["audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"];
        return {
          allowedContentTypes: kinds,
          maximumSizeInBytes: 25 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    res.setHeader("cache-control", "no-store");
    return res.status(200).json(json);
  } catch (e) {
    return res.status(400).json({ error: String((e && e.message) || e) });
  }
}
