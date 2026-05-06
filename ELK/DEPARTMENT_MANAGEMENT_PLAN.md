# KẾ HOẠCH QUẢN LÝ PHÒNG BAN

**Ngày:** April 15, 2026  
**Dự án:** Security Incident Response Dashboard (`security-elk`)  
**Trạng thái:** Bản kế hoạch đã điều chỉnh  
**Mục tiêu:** Bổ sung quản lý phòng ban theo cách phù hợp với codebase hiện tại, dữ liệu hiện tại và mô hình triển khai bằng Docker.

---

## 1. Đánh Giá Thực Trạng Dự Án

Dự án hiện tại đã có:

- Backend: Node.js + Express + MongoDB + Mongoose
- Frontend: React SPA với các route `dashboard`, `incidents`, `alerts`, `users`, `settings`
- Model `User` đang lưu `department` dưới dạng chuỗi đơn giản
- Quản trị người dùng qua `GET /api/auth/users` và `PUT /api/auth/users/:id`
- Trang `Users` đơn giản có thể cập nhật role, trạng thái active và text phòng ban
- Triển khai bằng Docker Compose cho frontend và backend

Các ràng buộc quan trọng từ implementation hiện tại:

- `User.department` hiện là chuỗi, chưa phải reference
- `Incident` chưa lưu ownership theo phòng ban
- Trang `Users` vẫn còn cơ bản, nên tính năng phòng ban đầu tiên cần tích hợp vào đây trước
- Các route auth và user ở backend hiện là nơi chính xử lý quản trị người dùng

Điều này có nghĩa là thiết kế ban đầu kiểu "full hierarchy + department ACL + incident routing + analytics" là quá lớn cho lượt triển khai đầu tiên trong repo này.

---

## 2. Phạm Vi Khuyến Nghị

### Khuyến nghị

Nên triển khai theo **từng pha**:

1. Phase 1: Nền tảng phòng ban
2. Phase 2: Migration người dùng an toàn và admin UI
3. Phase 3: Báo cáo theo phòng ban và lọc incident
4. Phase 4: Hierarchy tùy chọn và kiểm soát truy cập nâng cao

Cách này tốt hơn nhiều so với việc cố gắng rewrite toàn bộ schema trong một lần.

### Những Gì Cần Làm Trước

Phase 1 nên bàn giao được:

- Một collection `Department` thật sự
- Admin CRUD cho phòng ban
- Gán người dùng vào phòng ban bằng dropdown
- Migration an toàn từ `department` dạng chuỗi sang reference
- Tương thích ngược trong thời gian migration

### Những Gì Không Nên Làm Ngay Ở Phase 1

Những phần sau nên để lại:

- Hierarchy cha-con của phòng ban
- ACL riêng theo phòng ban
- Người dùng thuộc nhiều phòng ban
- Trang chi tiết phòng ban nhiều tab
- Chỉ số hiệu năng phòng ban
- Ownership phòng ban ở cấp schema của incident

Các phần này hữu ích, nhưng chưa cần để giải bài toán hiện tại của dự án.

---

## 3. Thiết Kế Mục Tiêu Sau Khi Điều Chỉnh

### 3.1 Department Model

Ban đầu chỉ tạo model tối giản.

```javascript
// backend/models/Department.js
{
  _id: ObjectId,
  name: String,          // "IT Security"
  code: String,          // "IT_SECURITY"
  description: String,
  manager: ObjectId,     // ref User, optional
  isActive: Boolean,     // default true
  sortOrder: Number,     // optional
  createdAt: Date,
  updatedAt: Date
}
```

Ghi chú:

- Không lưu `children`
- Không lưu `members`
- Không lưu color/icon nếu UI chưa thực sự cần
- Giữ model nhỏ và suy diễn dữ liệu bằng query

### 3.2 User Model

**Không** thay thế field cũ trong một bước.

Dùng giai đoạn tương thích:

```javascript
// backend/models/User.js
{
  // existing fields...

  department: String,               // field cũ, giữ tạm thời
  departmentId: ObjectId | null     // field mới, ref Department
}
```

Ghi chú:

- `departmentId` ban đầu là optional trong giai đoạn migration
- API hiện tại vẫn có thể trả về `department` trong lúc frontend chuyển đổi
- Sau khi migration hoàn tất và ổn định thì mới tính chuyện deprecate `department`

### 3.3 Incident Model

Không sửa `Incident` trong lượt triển khai đầu tiên.

Lý do:

- Schema incident hiện đã khá lớn và phức tạp
- Dự án chưa có domain model ổn định cho phòng ban
- Lọc incident theo phòng ban nên làm sau khi dữ liệu user-department đã ổn định

Nếu cần ở phase sau:

```javascript
responsibleDepartmentId: ObjectId | null
```

Nhưng phần này không nên chặn Phase 1.

---

## 4. Thiết Kế API Cho Dự Án Này

### 4.1 Department Endpoints Mới

Thêm file route riêng:

```text
GET    /api/departments
POST   /api/departments
GET    /api/departments/:id
PUT    /api/departments/:id
DELETE /api/departments/:id
```

Hành vi:

- `DELETE` là soft-delete bằng cách set `isActive=false`
- Chỉ admin mới được create/update/delete
- List endpoint nên hỗ trợ:
  - `isActive`
  - `q`
  - `sortBy`
  - `sortDir`

### 4.2 Mở Rộng User Endpoints Hiện Có

Thay vì tạo ngay một department-user API lồng nhau quá lớn, hãy mở rộng route admin user hiện tại:

```text
GET /api/auth/users?departmentId=<id>
PUT /api/auth/users/:id
```

Ví dụ payload update:

```json
{
  "role": "analyst",
  "isActive": true,
  "departmentId": "..."
}
```

Response nên bao gồm cả:

```json
{
  "department": "IT Security",
  "departmentId": "..."
}
```

Cách này giữ ổn định contract của trang `Users` hiện có trong khi vẫn nâng cấp data model.

---

## 5. Kế Hoạch Frontend Cho Repo Này

### 5.1 Điểm Chạm UI Đầu Tiên: Trang Users

Trang [Users](security-elk/frontend/src/pages/Users.js) hiện tại là nơi phù hợp nhất để bắt đầu.

Thay:

- chỉnh phòng ban bằng `prompt(...)`

Bằng:

- dropdown phòng ban lấy dữ liệu từ `/api/departments`
- filter phòng ban trên danh sách users
- hiển thị tên phòng ban từ dữ liệu đã join

### 5.2 Thêm Trang Quản Trị Department

Trước hết chỉ thêm một trang:

```text
/departments
```

Phiên bản đầu nên có:

- Bảng danh sách phòng ban
- Form hoặc modal tạo phòng ban
- Chỉnh sửa phòng ban
- Kích hoạt/vô hiệu hóa phòng ban
- Gán manager nếu cần

Chưa cần làm trang chi tiết nhiều tab.

### 5.3 App Routing

Thêm route mới vào React app:

```text
/departments
```

Vị trí khuyến nghị:

- mục điều hướng chỉ dành cho admin trong sidebar
- giữ nguyên các page hiện tại

---

## 6. Chiến Lược Migration

### Mục tiêu

Chuyển từ:

- `User.department` là text tự do

Sang:

- collection `Department`
- `User.departmentId` là reference

### Trình Tự Rollout An Toàn

#### Bước 1: Deploy Schema Tương Thích

- Thêm model `Department`
- Thêm `User.departmentId` ở dạng optional
- Giữ lại chuỗi `department` hiện có
- Cập nhật API để đọc/ghi cả hai field ở nơi cần thiết

#### Bước 2: Backfill Departments

Tạo script migration để:

- đọc các giá trị `User.department` khác nhau và không rỗng
- chuẩn hóa tên
- tạo record `Department` nếu chưa có
- cập nhật user với `departmentId` đúng

#### Bước 3: Xác Minh Migration

Checklist xác minh:

- không có active user nào thiếu cả `department` lẫn `departmentId`
- mọi chuỗi phòng ban đã biết đều map về đúng một document `Department`
- danh sách users render đúng trên admin UI

#### Bước 4: Chuyển Frontend

- Trang `Users` đọc `departmentId` cùng tên hiển thị đã join
- Department dropdown trở thành source of truth

#### Bước 5: Dọn Dẹp Về Sau

Chỉ thực hiện sau khi đã xác minh production:

- ngừng ghi `department` dạng free-text
- sau này mới xóa hoặc deprecate field cũ

### Yêu Cầu Với Migration Script

Migration script phải:

- idempotent
- an toàn khi chạy lại
- bỏ qua giá trị department null/rỗng/chỉ chứa khoảng trắng
- log rõ số department được tạo và user được cập nhật
- thoát với mã lỗi khác 0 khi gặp lỗi nghiêm trọng

---

## 7. Kế Hoạch Triển Khai

### Phase 0: Chuẩn Bị (0.5 ngày)

- Rà soát chất lượng dữ liệu user hiện có trong MongoDB
- Liệt kê các giá trị department string hiện tại
- Chốt rule chuẩn hóa để sinh `department code`
- Xác nhận phase đầu có cần gán manager hay không

### Phase 1: Backend Foundation (1.5 đến 2 ngày)

- Tạo `backend/models/Department.js`
- Tạo `backend/routes/departments.js`
- Đăng ký route mới trong `backend/server.js`
- Thêm validation cho create/update department
- Thêm `departmentId` vào `backend/models/User.js`
- Mở rộng admin user list filter để hỗ trợ `departmentId`
- Mở rộng user update endpoint để nhận `departmentId`

Acceptance criteria:

- admin có thể tạo/cập nhật/vô hiệu hóa department
- admin có thể xem danh sách department
- user update endpoint chấp nhận department reference

### Phase 2: Migration Và Tương Thích (1 ngày)

- Tạo `backend/scripts/migrate-departments.js`
- Backfill departments từ user strings hiện có
- Cập nhật auth/user responses để trả cả field cũ lẫn field mới
- Thêm script verify cơ bản hoặc manual checklist

Acceptance criteria:

- user hiện tại vẫn hoạt động sau deployment
- migration có thể chạy lại mà không sinh department trùng

### Phase 3: Frontend Integration (1.5 đến 2 ngày)

- Thêm page `/departments`
- Thêm mục điều hướng trên sidebar cho admin
- Thay prompt chỉnh phòng ban trên `Users` bằng dropdown
- Thêm filter phòng ban cho trang `Users`
- Hiển thị tên phòng ban rõ ràng trong bảng

Acceptance criteria:

- admin có thể quản lý department từ UI
- admin có thể gán user vào department từ UI
- không làm regression luồng quản lý user hiện có

### Phase 4: Documentation And Verification (0.5 đến 1 ngày)

- Cập nhật API docs
- Cập nhật onboarding/deployment notes
- Thêm migration runbook
- Verify hành vi trong môi trường Docker

Acceptance criteria:

- kế hoạch có thể tái hiện được trên stack hiện tại
- các bước deploy Docker được ghi lại rõ ràng

Ước lượng thực tế cho phiên bản hữu dụng đầu tiên:

- **4 đến 6 ngày làm việc**

Con số này nhỏ hơn và an toàn hơn so với thiết kế “all-in” 7 ngày trước đó.

---

## 8. Ghi Chú Về Docker Và Deployment

Vì dự án chạy trong Docker:

- thay đổi backend cần rebuild container backend
- thay đổi frontend cần rebuild container frontend
- migration chỉ nên chạy sau khi backend schema tương thích đã lên live

Thứ tự rollout khuyến nghị:

1. Backup MongoDB
2. Deploy backend tương thích
3. Chạy migration script
4. Rebuild frontend
5. Validate luồng admin user

---

## 9. Rủi Ro Và Cách Giảm Thiểu

### Rủi ro 1: Dữ Liệu Department Cũ Không Sạch

Ví dụ:

- `IT Security`
- `it security`
- `IT-Security`
- chuỗi rỗng

Giảm thiểu:

- chuẩn hóa tên trước khi tạo `Department`
- nếu cần, giữ một danh sách alias để review thủ công

### Rủi ro 2: Làm Hỏng Luồng User Hiện Có

Giảm thiểu:

- giữ `department` cũ trong thời gian migration
- chưa đặt `departmentId` là required ngay

### Rủi ro 3: Scope Creep

Giảm thiểu:

- hierarchy, ACL và department ownership của incident được xác định rõ là phase 2+

### Rủi ro 4: Admin UI Quá Phức Tạp

Giảm thiểu:

- bắt đầu bằng một trang danh sách department
- tránh làm detail page nhiều tab ở lượt đầu

---

## 10. Ngoài Phạm Vi Của Bản Phát Hành Đầu Tiên

Các phần sau được cố ý để lại:

- UI cây phòng ban / hierarchy
- model cha-con cho phòng ban
- user thuộc nhiều phòng ban
- ma trận phân quyền riêng theo phòng ban
- routing incident theo phòng ban
- dashboard hiệu năng phòng ban
- load testing cho cây department lớn

Các phần này có thể làm sau khi nền tảng phòng ban đã ổn định.

---

## 11. Khuyến Nghị

**Hướng triển khai khuyến nghị cho repo này:**

- Xây dựng domain `Department` tối giản trước
- Giữ backward compatibility cho `User.department`
- Tích hợp gán phòng ban vào workflow `Users` hiện có
- Thêm một trang admin cho `Department`
- Hoãn hierarchy và ACL

Cách này giúp dự án có một hệ thống phòng ban usable mà không làm mất ổn định auth, users, incidents hoặc Docker deployment.

---

## 12. Trình Tự Coding Đề Xuất

Nếu bắt đầu triển khai ngay, nên theo thứ tự:

1. Tạo `Department` model
2. Tạo department CRUD route
3. Thêm `departmentId` vào `User`
4. Mở rộng user list/update endpoints
5. Tạo migration script
6. Cập nhật trang `Users` để dùng department dropdown
7. Thêm trang admin `/departments`
8. Rebuild Docker services và verify các luồng

Đây là đường đi ngắn nhất để có một deliverable thật sự phù hợp với codebase hiện tại.

---

## 13. Checklist Triển Khai

Dùng phần này làm checklist làm việc trong quá trình implementation.

### A. Chuẩn Bị

- [x] Export các giá trị `User.department` khác nhau hiện có từ MongoDB
- [x] Rà soát các giá trị department lỗi/rỗng và chốt rule chuẩn hóa
- [x] Xác định format `department code`, ví dụ `IT_SECURITY`
- [x] Quyết định `manager` có phải optional trong bản đầu hay không
- [x] Xác nhận phạm vi bản đầu loại trừ hierarchy, ACL và incident ownership

Kết quả Phase A thu thập ngày April 15, 2026:

- Giá trị department hiện có trong MongoDB live: `IT Security`, `Management`, `SOC`
- Kiểm tra chất lượng dữ liệu user:
  - `totalUsers = 3`
  - `nullDepartment = 0`
  - `missingDepartment = 0`
  - `emptyDepartment = 0`
  - `whitespaceDepartment = 0`
- Seed departments mặc định cho bản đầu:
  - `IT Security`
  - `SOC`
  - `Management`
- Quyết định cho bản đầu:
  - `manager` vẫn là optional
  - hierarchy được để lại
  - department ACL được để lại
  - incident department ownership được để lại

Các quy tắc chuẩn hóa đã chốt:

- Trim khoảng trắng đầu/cuối
- Gộp nhiều khoảng trắng liên tiếp ở giữa thành một khoảng trắng
- Giữ tên hiển thị dễ đọc trong `Department.name`
- Sinh `Department.code` từ tên đã chuẩn hóa theo uppercase snake case
- Thay khoảng trắng và ký tự phân tách bằng `_`
- Loại bỏ `_` trùng lặp
- Ví dụ:
  - `IT Security` -> `IT_SECURITY`
  - `SOC` -> `SOC`
  - `Management` -> `MANAGEMENT`

### B. Backend Foundation

- [x] Tạo `security-elk/backend/models/Department.js`
- [x] Thêm index cho `name`, `code` và `isActive`
- [x] Tạo `security-elk/backend/routes/departments.js`
- [x] Thêm admin-only CRUD endpoints cho department
- [x] Implement soft delete qua `isActive=false`
- [x] Đăng ký department routes trong `security-elk/backend/server.js`
- [x] Thêm validation cho create/update department requests
- [x] Cập nhật `security-elk/backend/models/User.js` để có `departmentId` optional
- [x] Giữ chuỗi `department` cũ trong giai đoạn compatibility
- [x] Mở rộng `GET /api/auth/users` để hỗ trợ filter `departmentId`
- [x] Mở rộng `PUT /api/auth/users/:id` để nhận `departmentId`
- [x] Cho user responses trả cả `department` và `departmentId`

### C. Backend Verification

- [x] Verify department CRUD hoạt động ở mức API
- [x] Verify chỉ admin mới có thể create/update/deactivate departments
- [x] Verify user list vẫn hoạt động khi chưa có `departmentId`
- [x] Verify việc update user với `departmentId` không làm hỏng auth flow hiện có

Verification hoàn tất ngày April 15, 2026:

- Static verification:
  - `node --check` pass cho `Department.js`, `User.js`, `routes/departments.js`, `routes/auth.js`, `server.js`, và `validator.js`
- Runtime/API verification:
  - `POST /api/auth/login` thành công với admin
  - `GET /api/auth/users` trả đúng legacy users khi toàn bộ seeded users vẫn có `departmentId = null`
  - `POST /api/departments`, `GET /api/departments`, `GET /api/departments/:id`, `PUT /api/departments/:id`, và `DELETE /api/departments/:id` đều hoạt động với admin token
  - thử tạo department bằng non-admin trả `403`
  - `PUT /api/auth/users/:id` nhận `departmentId` hợp lệ, cập nhật `department` display name, và `GET /api/auth/users?departmentId=...` filter đúng
  - update với `departmentId` không hợp lệ/không tồn tại trả `400`
- Dọn dữ liệu sau verification:
  - khôi phục seeded `viewer` về `department = Management` và `departmentId = null`
  - soft-delete temporary verification department
  - disable account tạm `phasecviewer@example.com` dùng để test permission

### D. Migration

- [x] Tạo `security-elk/backend/scripts/migrate-departments.js`
- [x] Chuẩn hóa và loại bỏ trùng lặp trong legacy department names
- [x] Bỏ qua giá trị null, rỗng hoặc chỉ có khoảng trắng
- [x] Chỉ tạo `Department` row nếu chưa có
- [x] Cập nhật `departmentId` cho user tương ứng
- [x] Làm cho migration an toàn khi chạy lại
- [x] Log summary: số departments tạo mới, users cập nhật, values bị bỏ qua

Thực thi migration hoàn tất ngày April 15, 2026:

- Thêm các lệnh backend:
  - `npm run migrate:departments`
  - `npm run migrate:departments:dry-run`
- Dry-run trước khi apply cho kết quả:
  - `totalUsersScanned = 4`
  - `usersWouldUpdate = 4`
  - `departmentsCreated = 3`
- Lần apply thật hoàn tất với:
  - `usersUpdated = 4`
  - `departmentsCreated = 3`
  - canonical departments được tạo: `IT Security`, `SOC`, `Management`
- Dry-run sau khi apply xác nhận rerun-safe:
  - `usersAlreadyAssigned = 4`
  - `usersWouldUpdate = 0`
  - `departmentsCreated = 0`

### E. Migration Verification

- [x] Kiểm tra không có active user nào thiếu cả `department` lẫn `departmentId`
- [x] Kiểm tra mỗi normalized department map về đúng một `Department` record
- [x] Kiểm tra user update endpoint vẫn hoạt động sau migration
- [x] Chuẩn bị rollback note phòng trường hợp migration sai

Migration verification hoàn tất ngày April 15, 2026:

- Verify `PUT /api/auth/users/:id` vẫn hoạt động sau migration bằng cách chuyển seeded `viewer` từ `Management -> SOC -> Management`
- Verify response vẫn trả về:
  - `department`
  - `departmentId`
  - `departmentDetails`
- Verify canonical records sau migration vẫn giữ:
  - `IT Security`
  - `SOC`
  - `Management`

Rollback note:

- Nếu kết quả migration sai ở môi trường khác, không được drop `departments` collection một cách mù quáng
- Trước tiên phải khôi phục hành vi user-facing bằng cách đưa user về legacy-only mode:
  - set `User.departmentId = null`
  - giữ hoặc khôi phục `User.department` string từ nguồn đúng hoặc backup
- Sau đó mới deactivate hoặc remove những departments do migration tạo, và chỉ làm khi đã xác nhận chúng không còn được record nào khác tham chiếu
- Thứ tự rollback khuyến nghị:
  1. tạo MongoDB backup hoặc snapshot
  2. xác định các user đã bị cập nhật trong cửa sổ migration
  3. bulk reset `departmentId` về `null` cho các user đó
  4. khôi phục `department` string nếu có giá trị nào bị chuẩn hóa sai
  5. verify login, `/api/auth/users`, và user update endpoint
  6. chỉ sau đó mới quyết định có nên deactivate hoặc delete các `Department` rows do migration tạo
- Vì `User.department` cũ vẫn còn được giữ trong phase này nên rollback vẫn có rủi ro thấp, miễn là chưa xóa các giá trị `department` dạng chuỗi

### F. Frontend Integration

- [x] Thêm department service calls vào frontend data flow
- [x] Cập nhật `security-elk/frontend/src/pages/Users.js`
- [x] Thay manual department prompt bằng dropdown selector
- [x] Thêm department filter vào trang `Users`
- [x] Hiển thị display name của department nhất quán trong bảng users
- [x] Thêm route `/departments` trong `security-elk/frontend/src/App.js`
- [x] Thêm mục điều hướng sidebar cho quản lý department
- [x] Tạo admin page đầu tiên cho `/departments`
- [x] Hỗ trợ create, edit, activate/deactivate department trên UI
- [x] Giữ phiên bản UI đầu tiên đơn giản, không làm detail tabs

### G. Frontend Verification

- [x] Verify trang `Users` load đúng department options
- [x] Verify admin có thể gán department cho user
- [x] Verify department filter hoạt động trên user list
- [x] Verify trang department hoạt động ở cả English và Vietnamese UI
- [x] Verify không có regression ở users, alerts, incidents và dashboard

Frontend verification hoàn tất ngày April 15, 2026:

- Frontend SPA routes trả `200` cho:
  - `/dashboard`
  - `/alerts`
  - `/incidents`
  - `/users`
  - `/departments`
- Verify data dependencies của trang `Users`:
  - `/api/departments?isActive=true&sortBy=name` trả 3 active departments
  - `/api/auth/users?limit=20` trả users với `department`, `departmentId`, và `departmentDetails`
- Verify luồng gán department của admin trên đúng các endpoint UI đang dùng:
  - chuyển seeded `viewer` từ `Management` sang `SOC`
  - verify `GET /api/auth/users?departmentId=<SOC>` trả đúng danh sách mong đợi
  - khôi phục seeded `viewer` về `Management`
- Verify các API phụ thuộc của trang khác sau khi frontend thay đổi:
  - `/api/dashboard/stats`
  - `/api/dashboard/recent-incidents?limit=20`
  - `/api/alerts?limit=20`
  - `/api/incidents?limit=20`
- Verify English/Vietnamese:
  - cả `en.js` và `vi.js` đều có đủ translation keys mới cho `departments` và `users`
  - frontend production build hoàn tất thành công sau khi cập nhật localization

### H. Docker Rollout

- [x] Backup MongoDB trước rollout
- [x] Rebuild backend container sau khi sửa backend
- [x] Chỉ chạy migration sau khi backend tương thích đã lên live
- [x] Rebuild frontend container sau khi sửa frontend
- [x] Validate app qua Docker, không chỉ qua local npm build

Docker rollout hoàn tất ngày April 15, 2026:

- MongoDB backup được tạo tại:
  - `security-elk/backups/mongodb/security_incidents_departments_20260415_144823.archive.gz`
- Rebuild và restart các service triển khai bằng:
  - `docker compose up -d --build backend frontend`
- Validation sau rollout pass:
  - `docker compose ps` cho thấy `backend`, `frontend`, và `mongodb` healthy/up
  - `GET http://localhost:5001/health` trả `status = OK`
  - `GET http://localhost:3000/departments` trả `200`
  - `docker exec backend npm run migrate:departments:dry-run` xác nhận:
    - `usersAlreadyAssigned = 4`
    - `usersWouldUpdate = 0`
    - `departmentsCreated = 0`
- Cảnh báo từ compose trong quá trình rollout:
  - `API_URL` và `SAMPLE_IP` chưa được set nên mặc định là rỗng trong môi trường hiện tại
  - rollout vẫn hoàn tất vì các biến này không chặn tính năng department

### I. Documentation

- [x] Cập nhật backend API documentation cho departments
- [x] Ghi lại request/response fields mới cho user endpoints
- [x] Thêm migration runbook kèm command examples
- [x] Thêm deployment order cho Docker rollout
- [x] Ghi lại các phần deferred của phase 2

Documentation hoàn tất ngày April 15, 2026:

- Thay `security-elk/backend/API_DOCUMENTATION.md` bằng bản tài liệu sạch, đúng với trạng thái hiện tại, bao gồm:
  - department CRUD endpoints
  - các field mới `departmentId` và `departmentDetails` trên user responses
  - migration runbook commands
  - Docker deployment order
  - rollback guidance
  - deferred scope của phase 2
- Thay `security-elk/backend/docs/swagger-auth.js` để ghi lại:
  - user response shape mới
  - `departmentId` request/query fields
  - contract quản trị user hiện tại
- Thêm `security-elk/backend/docs/swagger-departments.js` cho department endpoints
- Cập nhật `security-elk/backend/swagger.js` để thêm tag `Departments`

### J. Deferred Cho Phase 2

- [x] Department hierarchy
- [x] Parent-child tree UI
- [ ] Department-specific ACL
- [ ] Multi-department membership
- [ ] Incident ownership by department
- [ ] Department analytics and performance dashboard

Cập nhật Phase 2 ngày April 15, 2026:

- Nền tảng department hierarchy đã được triển khai và verify trong Docker:
  - thêm `Department.parentDepartment` vào backend model
  - create/update department API hỗ trợ gán parent
  - validation của hierarchy chặn parent id không hợp lệ, self-parent và cycle
  - không thể deactivate department cha nếu còn child department active
- Runtime verification hoàn tất sau khi rebuild `backend` và `frontend`:
  - admin login thành công
  - gán `SOC -> IT Security` làm parent hoạt động đúng
  - đọc lại department trả `parentDepartment` đã populate
  - thử deactivate `IT Security` khi `SOC` đang là child trả `400`
  - thử self-parent update trả `400`
  - dữ liệu hierarchy phục vụ test đã được reset sau verification
- Phần còn lại của phase 2 vẫn đang mở:
  - các tương tác hierarchy phong phú hơn ngoài tree visualization bản đầu
  - department ACL
  - multi-department membership
  - incident ownership theo department
  - analytics
