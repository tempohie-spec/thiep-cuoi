# Thiệp cưới online

Trang thiệp mời cưới (HTML/CSS/JS thuần) chạy trên Vercel, kèm trang chỉnh sửa có nút Đăng thiệp.

## Hai trang song song
- `/` là thiệp để gửi cho mọi người. Link riêng cho từng khách: `/?to=Tên khách`.
- `/editor.html` là trang chỉnh sửa có xem trước trực tiếp. Nhập mật khẩu rồi bấm "Đăng thiệp", khách sẽ thấy nội dung mới sau tối đa khoảng 1 phút. Có thể tải ảnh lên trực tiếp.

Nội dung đã đăng và ảnh được lưu bằng Vercel Blob qua 2 hàm trong thư mục `api/`. Chưa đăng lần nào thì thiệp dùng nội dung mặc định trong `public/config.js`.

## Hai trang web riêng: nhà trai và nhà gái
Cùng một mã nguồn (repo này) chạy trên **hai dự án Vercel riêng**, mỗi dự án có kho lưu trữ (Blob) và mật khẩu quản trị riêng nên nội dung, ảnh, nhạc, lời chúc, Google Sheet và editor của hai bên hoàn toàn tách biệt:
- Nhà trai: https://hieuduyenwedding.vercel.app (hiện tên **Hiếu & Duyên**, nhà trai ở trước)
- Nhà gái: https://duyenhieuwedding.vercel.app (hiện tên **Duyên & Hiếu**, nhà gái ở trước)

Mã nhận biết bên nào theo tên miền: tên miền bắt đầu bằng `duyenhieu` là nhà gái, còn lại là nhà trai. Khi thử cục bộ có thể thêm `?side=bride` hoặc `?side=groom` vào link (cả trang thiệp lẫn `/editor.html`).

### Tạo dự án Vercel thứ hai cho nhà gái (làm một lần)
1. vercel.com > Add New > Project > chọn lại repo `thiep-cuoi`, đặt tên dự án là `duyenhieuwedding`, Framework Preset là Other, bấm Deploy.
2. Vào dự án mới > Storage > Create Database > Blob (quyền Public) > Connect to Project, tick "Add a read-write token env var".
3. Settings > Environment Variables > thêm `ADMIN_PASSWORD` (mật khẩu editor của nhà gái, tick Sensitive).
4. Deployments > Redeploy bản mới nhất.
Nếu tên `duyenhieuwedding` đã có người dùng, Vercel sẽ gợi ý tên khác, khi đó cần đổi tên miền hoặc nhờ chỉnh lại cách nhận biết bên trong `public/config.js`.

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
