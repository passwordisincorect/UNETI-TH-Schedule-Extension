# UNETI - Lịch TH theo học phần v1.5.0

Extension Chrome/Edge cá nhân cho cổng sinh viên UNETI.

## Điểm mới v1.5.0

- Chỉ lấy các học phần có chữ **“Thực hành”**.
- **Thứ**, **Từ tiết**, **Đến tiết** được chọn bằng danh sách, không nhập thủ công.
- Nhập **Phòng** và **Giảng viên** trực tiếp.
- Mỗi môn có nút **Xác nhận**. Môn chỉ xuất hiện trên lịch sau lần xác nhận đầu tiên.
- Trạng thái xác nhận được lưu trong `chrome.storage.local`; F5, đóng/mở trình duyệt và đăng nhập lại không cần xác nhận lại.
- Sau khi đã xác nhận, sửa thứ/tiết/phòng/giảng viên sẽ tự cập nhật lịch mà không cần xác nhận lần nữa.
- Khi bấm **Tiếp / Trở về / Hiện tại** trên lịch tuần, môn TH tự được chèn lại.
- Ô lịch TH dùng màu nền **#71CB35**.
- Ô lịch cao vừa nội dung, không kéo dài theo toàn bộ dải tiết.
- Tự lấy **Lớp HP** và **Mã lớp HP** từ danh sách đăng ký UNETI.

## Quy tắc tiết

Một môn phải nằm trong cùng một ca:

- Sáng: tiết 1–6
- Chiều: tiết 7–12
- Tối: tiết 13–15

Ví dụ hợp lệ: Thứ 2, từ tiết 1 đến tiết 6.

## Cách dùng

1. Mở danh sách học phần đã đăng ký trên UNETI.
2. Bấm **TH** → **Quét lại**.
3. Chọn Thứ, Từ tiết, Đến tiết; nhập Phòng và Giảng viên.
4. Bấm **Xác nhận** đúng một lần cho môn đó.
5. Mở **Lịch theo tuần** để xem ô TH màu xanh.

Dữ liệu chỉ nằm trong trình duyệt của bạn và không sửa dữ liệu trên máy chủ UNETI.
