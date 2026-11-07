# Thiệp cưới online

Trang thiệp mời cưới (HTML/CSS/JS thuần) chạy trên Vercel, kèm trang chỉnh sửa có nút Đăng thiệp.

## Hai trang song song
- `/` là thiệp để gửi cho mọi người. Link riêng cho từng khách: `/?to=Tên khách`.
- `/editor.html` là trang chỉnh sửa có xem trước trực tiếp. Nhập mật khẩu rồi bấm "Đăng thiệp", khách sẽ thấy nội dung mới sau tối đa khoảng 1 phút. Có thể tải ảnh lên trực tiếp.

Nội dung đã đăng và ảnh được lưu bằng Vercel Blob qua 2 hàm trong thư mục `api/`. Chưa đăng lần nào thì thiệp dùng nội dung mặc định trong `public/config.js`.

## Cài đặt trên Vercel (làm một lần)
1. Vercel > Add New > Project > chọn repo `thiep-cuoi`. Framework Preset để Other, giữ nguyên các mục khác (đã có `vercel.json`). Bấm Deploy.
2. Vào project > Storage > Create Database > Blob, đặt tên bất kỳ, chọn quyền Public, rồi Connect to Project. Vercel tự thêm biến `BLOB_READ_WRITE_TOKEN`.
3. Settings > Environment Variables > thêm `ADMIN_PASSWORD` (mật khẩu bạn chọn, tick Sensitive).
4. Deployments > bấm dấu ba chấm ở bản mới nhất > Redeploy.

## Chạy thử
```bash
cd public && python3 -m http.server 8000
```
Chạy cục bộ thì nút Đăng thiệp không hoạt động vì chưa có hàm API.
