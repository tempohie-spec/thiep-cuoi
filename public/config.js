// Chỉnh sửa toàn bộ thông tin thiệp cưới tại đây
window.WEDDING = {
  groom: { name: "Hiếu", fullName: "Đoàn Trung Hiếu", parents: "Ông Đoàn Danh Tuyến & Bà Đinh Thị Mai" },
  bride: { name: "Duyên", fullName: "Vũ Thị Duyên", parents: "Ông Vũ Xuân Quý & Bà Trần Thị Dinh" },
  // Thời điểm dùng cho đồng hồ đếm ngược (giờ Việt Nam)
  date: "2026-12-20T11:00:00+07:00",
  quote: "Hai trái tim, một hành trình. Trân trọng kính mời bạn đến chung vui cùng chúng mình.",
  events: [
    {
      title: "Lễ Vu Quy",
      time: "08:00, Chủ Nhật 20/12/2026",
      lunar: "Nhằm ngày 11 tháng 11 năm Bính Ngọ",
      place: "Tư gia nhà gái",
      address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
      map: "https://maps.google.com/?q=10.7769,106.7009"
    },
    {
      title: "Tiệc Cưới",
      time: "11:00, Chủ Nhật 20/12/2026",
      lunar: "Nhằm ngày 11 tháng 11 năm Bính Ngọ",
      place: "Trung tâm Tiệc cưới XYZ, Sảnh Ruby",
      address: "456 Đường DEF, Quận 3, TP. Hồ Chí Minh",
      map: "https://maps.google.com/?q=10.7798,106.6990"
    }
  ],
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
  heroAlign: "bottom", // vị trí chữ trên ảnh bìa: top, center, bottom
  music: "" // ví dụ: "music.mp3"
};
