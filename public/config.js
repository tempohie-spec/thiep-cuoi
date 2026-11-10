// Chỉnh sửa toàn bộ thông tin thiệp cưới tại đây
window.WEDDING = {
  groom: { name: "Hiếu", fullName: "Đoàn Trung Hiếu", parents: "Ông Đoàn Danh Tuyến & Bà Đinh Thị Mai" },
  bride: { name: "Duyên", fullName: "Vũ Thị Duyên", parents: "Ông Vũ Xuân Quý & Bà Trần Thị Dinh" },
  // Thời điểm dùng cho đồng hồ đếm ngược (giờ Việt Nam)
  date: "2026-12-20T11:00:00+07:00",
  quote: "Hai trái tim, một hành trình. Trân trọng kính mời bạn đến chung vui cùng chúng mình.",
  // Thẻ sự kiện lật: ảnh mặt trước, ảnh mặt sau và link Google Maps (bấm vào hình bản đồ ở mặt sau)
  eventFront: "images/event-front.webp",
  eventBack: "images/event-back.webp",
  eventMap: "https://maps.google.com/?q=Đền+thánh+Giuse+Sa+Châu+Giao+Hưng+Ninh+Bình",
  story: [
    { year: "2020", title: "Lần đầu gặp gỡ", text: "Chúng mình gặp nhau trong một buổi chiều mưa ở quán cà phê nhỏ." },
    { year: "2022", title: "Chính thức hẹn hò", text: "Từ những tin nhắn chúc ngủ ngon, chúng mình bắt đầu một hành trình mới." },
    { year: "2026", title: "Lời cầu hôn", text: "Dưới bầu trời Đà Lạt, anh hỏi và em đã gật đầu." }
  ],
  // Đặt ảnh vào thư mục images/ rồi khai báo tên file ở đây
  gallery: ["images/1.jpg", "images/2.jpg", "images/3.jpg", "images/4.jpg", "images/5.jpg", "images/6.jpg"],
  gifts: [
    { side: "Chú rể", bank: "Vietcombank", account: "0123456789", owner: "DOAN TRUNG HIEU", qr: "" },
    { side: "Cô dâu", bank: "Techcombank", account: "9876543210", owner: "VU THI DUYEN", qr: "" }
  ],
  // Dán URL Google Apps Script / Formspree để nhận phản hồi RSVP. Để trống thì lưu tạm và hiển thị cảm ơn.
  rsvpEndpoint: "",
  coverStrength: 100, // độ đậm ảnh bìa, 0 đến 100
  heroAlign: "bottom", // vị trí chữ trên ảnh bìa: top, center, bottom
  music: "" // ví dụ: "music.mp3"
};
