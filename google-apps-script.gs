/**
 * Google Apps Script cho thiệp cưới: nhận xác nhận tham dự và lời chúc từ thiệp,
 * ghi vào Google Sheet, và trả về các lời chúc đã được tick "Hiển thị lời chúc".
 *
 * CÀI ĐẶT (làm một lần):
 * 1. Tạo một Google Sheet mới (ví dụ tên "Thiệp cưới - Phản hồi").
 * 2. Trong Sheet: Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa hết mã có sẵn, dán toàn bộ file này vào, bấm Lưu.
 * 4. Bấm Triển khai (Deploy) > Tùy chọn triển khai mới (New deployment):
 *      - Loại: Ứng dụng web (Web app)
 *      - Thực thi dưới dạng (Execute as): Tôi (Me)
 *      - Người có quyền truy cập (Who has access): Bất kỳ ai (Anyone)
 *    Bấm Triển khai, cấp quyền khi được hỏi.
 * 5. Sao chép "URL ứng dụng web" (dạng https://script.google.com/macros/s/.../exec)
 *    rồi dán vào ô "Link Web App" trong editor của thiệp, bấm Đăng thiệp.
 *
 * DÙNG CHUNG CHO HAI THIỆP: dán cùng một "URL ứng dụng web" vào editor của cả thiệp nhà trai lẫn nhà gái.
 * Cột "Nhà" ghi rõ khách gửi từ thiệp Nhà trai hay Nhà gái. Lời chúc đã tick hiện ở cả hai thiệp.
 *
 * DUYỆT LỜI CHÚC: trong trang tính "Phản hồi", tick vào ô cột "Hiển thị lời chúc"
 * của lời chúc nào thì lời chúc đó sẽ hiện trên thiệp (bỏ tick để ẩn).
 *
 * Khi sửa mã này, cần Triển khai > Quản lý triển khai > sửa phiên bản thành "Phiên bản mới"
 * để link cũ dùng mã mới.
 */

const SHEET_NAME = "Phản hồi";
const HEADERS = ["Thời gian", "Tên", "Số điện thoại", "Tham dự", "Số người", "Lời chúc", "Hiển thị lời chúc", "Nhà"];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  } else if (!String(sh.getRange(1, 8).getValue()).trim()) {
    // trang tính cũ chưa có cột "Nhà": thêm tiêu đề cột thứ 8
    sh.getRange(1, 8).setValue("Nhà").setFontWeight("bold");
  }
  return sh;
}

// Chặn chèn công thức vào Sheet (ô bắt đầu bằng = + - @ sẽ được ghi dạng chữ) và giới hạn độ dài
function clean_(v, max) {
  let s = String(v == null ? "" : v).slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Thiệp gửi form xác nhận tham dự tới đây
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (!String(p.name || "").trim()) return json_({ ok: false, error: "Thiếu tên" });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = sheet_();
    sh.appendRow([
      new Date(),
      clean_(p.name, 100),
      "'" + clean_(p.phone, 20).replace(/^'/, ""),
      p.attend === "no" ? "Không đến" : "Sẽ đến",
      clean_(p.guests, 10),
      clean_(p.message, 500),
      false,
      p.side === "Nhà gái" ? "Nhà gái" : "Nhà trai",
    ]);
    sh.getRange(sh.getLastRow(), 7).insertCheckboxes();
  } finally {
    lock.releaseLock();
  }
  return json_({ ok: true });
}

// Thiệp đọc các lời chúc đã được tick "Hiển thị lời chúc"
function doGet() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  const wishes = rows
    .filter((r) => r[6] === true && String(r[5]).trim())
    .map((r) => ({ name: String(r[1]).replace(/^'/, ""), text: String(r[5]).replace(/^'/, "") }));
  return json_({ wishes: wishes });
}
