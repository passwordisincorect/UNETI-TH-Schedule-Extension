# UNETI - Lịch thực hành theo học phần (v1.5.1)

Extension **Manifest V3** cho Chrome/Edge, dùng trên cổng sinh viên UNETI để quản lý các môn **Thực hành** thuộc danh sách học phần đã đăng ký của học kỳ hiện tại và hiển thị lại trên lịch tuần.

## Yêu cầu

- Trình duyệt Chrome hoặc Microsoft Edge có hỗ trợ extension Manifest V3.
- Truy cập cổng sinh viên tại `https://sinhvien.uneti.edu.vn/` hoặc `https://apisv.uneti.edu.vn/`.

## Cài đặt

1. Tải mã nguồn repository, giải nén nếu tải dưới dạng ZIP.
2. Mở `chrome://extensions` (Chrome) hoặc `edge://extensions` (Edge).
3. Bật **Developer mode** / **Chế độ dành cho nhà phát triển**.
4. Chọn **Load unpacked** / **Tải tiện ích đã giải nén** và chỉ tới thư mục chứa `manifest.json`, `content.js`, `styles.css`.
5. Mở lại trang cổng sinh viên UNETI sau khi bật extension.

Không có file ZIP phát hành hoặc lệnh cài đặt riêng được khai báo trong mã nguồn hiện tại; đây là quy trình nạp extension từ source.

## Cấu hình và quyền

`manifest.json` khai báo quyền `storage`; content script chỉ khớp hai miền cổng sinh viên nói trên. Dữ liệu cá nhân của extension lưu bằng `chrome.storage.local` với các khóa `uneti_th_courses_v2` và `uneti_th_last_scan_v2`, không cần cấu hình server riêng.

## Bắt đầu sử dụng

1. Trên cổng UNETI, mở danh sách **học phần đã đăng ký của học kỳ hiện tại**.
2. Bấm nút nổi **TH** để mở bảng **Lịch thực hành**.
3. Bấm **↻ Quét lại** nếu chưa thấy môn. Extension chỉ lấy các môn có chữ “Thực hành” trong bảng đăng ký hiện tại, không dùng các bảng lịch sử hoặc Chương trình khung.
4. Với từng môn, chọn **Thứ**, **Từ tiết**, **Đến tiết**; nhập phòng và giảng viên khi cần.
5. Bấm **Xác nhận**. Môn đã xác nhận được hiển thị trên lịch tuần khi cấu trúc bảng lịch được extension nhận diện.

Các khoảng tiết hợp lệ phải thuộc cùng một ca: **1–6**, **7–12** hoặc **13–15**. Mục đã xác nhận được lưu lại để hiển thị khi đổi tuần.

## Thay đổi v1.5.1

- Sửa vị trí môn thực hành ở ca Chiều/Tối trong lịch tuần.
- Khi quét lại học kỳ hiện tại, loại các môn cũ bị lưu nhầm nhưng giữ thứ, tiết, phòng, giảng viên và trạng thái xác nhận của môn còn đăng ký.
- Giữ màu lịch thực hành `#71CB35` và cơ chế xác nhận một lần.

## Dữ liệu và giới hạn

- Nút xóa dữ liệu có xác nhận sẽ xóa lịch thực hành **đã lưu trong extension**; không sửa dữ liệu đăng ký trên cổng UNETI.
- Extension dựa vào cấu trúc bảng/ô lịch của website hiện tại. Khi UNETI thay đổi giao diện, việc quét hoặc đặt môn lên lịch có thể không còn hoạt động như trước.
- Repository chưa cung cấp bộ test tự động hay file giấy phép; chưa có bằng chứng kiểm thử tương thích cho mọi phiên bản Chrome/Edge.

Mã nguồn chính: [`manifest.json`](manifest.json), [`content.js`](content.js), [`styles.css`](styles.css).
