// Chỉnh sửa toàn bộ thông tin thiệp cưới tại đây
// Hai trang web riêng: nhà trai (hieuduyenwedding.vercel.app) và nhà gái (duyenhieuwedding.vercel.app).
// Nhận biết theo tên miền (tên miền bắt đầu bằng "duyenhieu" là nhà gái); thêm ?side=bride hoặc ?side=groom vào link để thử.
(function () {
  const q = new URLSearchParams(location.search).get("side");
  window.SIDE = q === "bride" || q === "groom" ? q : /^duyenhieu/i.test(location.hostname) ? "bride" : "groom";
  document.documentElement.classList.add("side-" + window.SIDE);
})();
window.WEDDING = {
  groom: { name: "Hiếu", fullName: "Đoàn Trung Hiếu", parents: "Ông Đoàn Danh Tuyến & Bà Đinh Thị Mai", address: "Phường Bắc Giang, Thành phố Bắc Ninh" },
  bride: { name: "Duyên", fullName: "Vũ Thị Duyên", parents: "Ông Vũ Xuân Quý & Bà Trần Thị Dinh", address: "Xã Giao Hưng, tỉnh Ninh Bình" },
  // Thời điểm dùng cho đồng hồ đếm ngược (giờ Việt Nam)
  date: "2026-12-20T11:00:00+07:00",
  // Màu nền các trang 3, 5, 7 (chọn bằng thanh màu trong editor): sắc màu 0-360, độ rực 0-100, độ sáng 8-88
  theme: { h: 350, s: 59, l: 27 },
  quote: "Hai trái tim, một hành trình. Trân trọng kính mời bạn đến chung vui cùng chúng mình.",
  // Các thẻ sự kiện lật: mỗi thẻ có ảnh mặt trước, ảnh mặt sau và link Google Maps (bấm vào hình bản đồ ở mặt sau)
  eventCards: [
    { front: "images/event-front.webp", back: "images/event-back.webp", map: "https://maps.google.com/?q=Đền+thánh+Giuse+Sa+Châu+Giao+Hưng+Ninh+Bình" }
  ],
  // Đặt ảnh vào thư mục images/ rồi khai báo tên file ở đây
  gallery: ["images/1.jpg", "images/2.jpg", "images/3.jpg", "images/4.jpg", "images/5.jpg", "images/6.jpg"],
  gifts: [
    { side: "Chú rể", bank: "Vietcombank", account: "0123456789", owner: "DOAN TRUNG HIEU", qr: "" },
    { side: "Cô dâu", bank: "Techcombank", account: "9876543210", owner: "VU THI DUYEN", qr: "" }
  ],
  // Lời chúc của khách mời hiện ở page 6 dưới dạng các tờ giấy note: [{ name: "Tên khách", text: "Lời chúc" }]
  wishes: [],
  // Dán URL Google Apps Script / Formspree để nhận phản hồi RSVP. Để trống thì lưu tạm và hiển thị cảm ơn.
  sheetLink: "", // link Google Sheet (chỉ để bạn mở nhanh trong editor)
  rsvpEndpoint: "",
  // Vị trí và kích thước file bìa trong khung: s = kích thước % (100 là vừa kín khung), x và y = dịch ngang và dọc theo % của khung
  coverFit: { m: { s: 78, x: 0, y: 1.5 }, d: { s: 66, x: 0, y: 10 } },
  // Ảnh bìa động (WebP động nền trong suốt, nền giấy lộ ra) được cố định trong mã. coverLocked: true thì bỏ qua file bìa và vị trí đã đăng từ editor.
  cover: "images/cover-anim.webp",
  coverD: "",
  coverFitMode: "contain", // contain: vừa trong khung, nằm sát đáy | cover: phủ kín khung
  coverLocked: true,
  coverStrength: 100, // độ đậm ảnh bìa, 0 đến 100
  heroAlign: "bottom", // vị trí chữ trên ảnh bìa: top, center, bottom
  music: "" // ví dụ: "music.mp3"
};
