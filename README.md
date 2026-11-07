# Thiệp cưới online

Trang web thiệp mời cưới tĩnh (HTML/CSS/JS thuần), không cần build.

## Tính năng
- Màn hình phong bì "Mở thiệp", cá nhân hóa tên khách qua link `?to=Tên khách`
- Đếm ngược đến ngày cưới
- Thông tin hai bên gia đình, sự kiện (Lễ Vu Quy, Tiệc cưới) kèm link bản đồ
- Chuyện tình yêu dạng timeline, album ảnh có phóng to
- Form xác nhận tham dự (RSVP), hộp mừng cưới có nút sao chép số tài khoản
- Nhạc nền tùy chọn, responsive trên điện thoại

## Hai trang song song
- `/` là thiệp để gửi cho mọi người.
- `/editor.html` là trang chỉnh sửa có xem trước trực tiếp. Nhập mật khẩu rồi bấm "Đăng thiệp" là thiệp chính cập nhật ngay, có thể tải ảnh lên trực tiếp.

Cách hoạt động: nội dung đã đăng được lưu bằng Netlify Blobs qua Netlify Functions (thư mục `netlify/functions`). Chưa đăng lần nào thì thiệp dùng nội dung mặc định trong `public/config.js`.

## Cài đặt mật khẩu (bắt buộc, làm một lần)
Trên Netlify: Project configuration > Environment variables > Add a variable, tên `ADMIN_PASSWORD`, giá trị là mật khẩu bạn chọn. Sau đó vào Deploys > Trigger deploy > Deploy project without cache.

## Tùy chỉnh
1. Sửa thông tin bằng trang `/editor.html` (hoặc sửa trực tiếp `public/config.js` làm nội dung mặc định).
2. Ảnh nên tải lên qua editor. Cũng có thể đặt ảnh vào `public/images/` (`cover.jpg` cho ảnh nền, `1.jpg`...`6.jpg` cho album).
3. Muốn nhận RSVP: tạo Google Apps Script hoặc Formspree rồi dán URL vào `rsvpEndpoint`.

## Chạy thử
```bash
cd public && python3 -m http.server 8000
```

## Đăng lên mạng
Bật GitHub Pages (Settings > Pages > Branch `main`), hoặc kéo thả thư mục lên Netlify/Vercel.
