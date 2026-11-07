# Thiệp cưới online

Trang web thiệp mời cưới tĩnh (HTML/CSS/JS thuần), không cần build.

## Tính năng
- Màn hình phong bì "Mở thiệp", cá nhân hóa tên khách qua link `?to=Tên khách`
- Đếm ngược đến ngày cưới
- Thông tin hai bên gia đình, sự kiện (Lễ Vu Quy, Tiệc cưới) kèm link bản đồ
- Chuyện tình yêu dạng timeline, album ảnh có phóng to
- Form xác nhận tham dự (RSVP), hộp mừng cưới có nút sao chép số tài khoản
- Nhạc nền tùy chọn, responsive trên điện thoại

## Tùy chỉnh
1. Sửa thông tin trong `config.js`.
2. Đặt ảnh vào `images/` (`cover.jpg` cho ảnh nền, `1.jpg`...`6.jpg` cho album).
3. Muốn nhận RSVP: tạo Google Apps Script hoặc Formspree rồi dán URL vào `rsvpEndpoint`.

## Chạy thử
```bash
python3 -m http.server 8000
```

## Đăng lên mạng
Bật GitHub Pages (Settings > Pages > Branch `main`), hoặc kéo thả thư mục lên Netlify/Vercel.
