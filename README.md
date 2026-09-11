# UNETI - Lịch TH theo học phần v1.3.0

Extension Chrome/Edge dành cho cổng sinh viên UNETI.

## Chức năng

- Tự đọc danh sách **Lớp HP đã đăng ký trong học kỳ này**.
- Chỉ giữ các học phần có chữ **“Thực hành”** trong tên.
- Tự lấy **Mã lớp HP** và **Lớp học dự kiến** từ UNETI.
- Bạn chỉ cần nhập trực tiếp:
  - **Thời gian / Tiết** — ví dụ `Thứ 2, Tiết 1-6`.
  - **Phòng** — ví dụ `HA10-809`.
  - **Giảng viên** — ví dụ `Nguyễn Văn A`.
- Dữ liệu tự lưu trong `chrome.storage.local`.
- Reload, đóng/mở trình duyệt hoặc đăng xuất/đăng nhập lại UNETI vẫn giữ dữ liệu.
- Khi mở **Lịch theo tuần**, extension chèn học phần TH trực tiếp vào đúng ngày/ca như một học phần bình thường.
- Học phần do extension thêm có **nền xanh lá nhạt** để phân biệt với dữ liệu chính thức của trường.
- Nội dung ô lịch gồm: tên học phần, `Lớp HP - Mã lớp HP`, tiết, phòng và giảng viên.
- Không gửi hoặc sửa dữ liệu trên máy chủ UNETI.

## Cách dùng

1. Cài extension bằng `Load unpacked` trên `edge://extensions` hoặc `chrome://extensions`.
2. Đăng nhập UNETI và mở trang danh sách học phần đã đăng ký.
3. Bấm nút **TH** → **Quét lại**.
4. Điền `Thứ ..., Tiết ...-...`, phòng và tên giảng viên cho từng môn thực hành.
5. Mở mục **Lịch theo tuần**. Học phần TH cá nhân sẽ tự xuất hiện trên lịch với nền xanh lá nhạt.

## Định dạng thời gian hỗ trợ

Ví dụ:

- `Thứ 2, Tiết 1-6`
- `Thứ 4, Tiết: 7-12`
- `Chủ nhật, Tiết 13-15`

Các ca được ánh xạ theo lịch UNETI:

- Sáng: tiết 1-6
- Chiều: tiết 7-12
- Tối: tiết 13-15

## Lưu ý

Các ô TH do extension thêm chỉ là lớp giao diện trên trình duyệt của bạn. Chúng không làm thay đổi lịch chính thức trên hệ thống của trường.
