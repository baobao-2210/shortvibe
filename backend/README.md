# ShortVibe Backend - Database & Core Architecture

Dự án Backend phục vụ ứng dụng video ngắn **ShortVibe** (chia sẻ video dạng TikTok), hỗ trợ đồng thời cả nền tảng **Web ReactJS** và **Mobile ReactJS + Capacitor**.

---

## 1. Công nghệ sử dụng

- **Framework**: [NestJS](https://nestjs.com/) (TypeScript)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **ORM**: [Prisma ORM 5.22](https://www.prisma.io/)
- **Bảo mật mật khẩu**: `bcrypt` (10 rounds salt)
- **Containerization**: Docker & Docker Compose

---

## 2. Thiết kế Cơ sở Dữ liệu (5 Bảng Chính)

### 2.1. `users` (Quản lý người dùng)
- `id` (UUID, Primary Key): Định danh duy nhất theo chuẩn UUID v4.
- `username` (VARCHAR(50), UNIQUE): Tên tài khoản hiển thị dạng `@username`.
- `email` (VARCHAR(255), UNIQUE): Địa chỉ email đăng ký.
- `password_hash` (VARCHAR(255)): Mật khẩu đã băm bằng bcrypt, tuyệt đối không lưu plain-text.
- `display_name` (VARCHAR(100), Optional): Tên hiển thị công khai.
- `avatar_url` (VARCHAR(500), Optional): Đường dẫn ảnh đại diện.
- `bio` (TEXT, Optional): Tiểu sử cá nhân.
- `created_at` (TIMESTAMPTZ(6)): Thời điểm tạo tài khoản.
- `updated_at` (TIMESTAMPTZ(6)): Thời điểm cập nhật gần nhất.

### 2.2. `videos` (Quản lý video ngắn)
- `id` (UUID, Primary Key).
- `user_id` (UUID, Foreign Key -> `users.id`, `ON DELETE CASCADE`).
- `caption` (TEXT, Optional): Tiêu đề/mô tả kèm hashtag.
- `video_url` (VARCHAR(1000)): Đường dẫn file video (lưu trữ trên Object Storage như Cloudflare R2 / AWS S3, không lưu binary trực tiếp trong DB).
- `thumbnail_url` (VARCHAR(1000), Optional): Ảnh bìa preview của video.
- `duration_seconds` (INT, Optional): Thời lượng video (giây).
- `visibility` (ENUM: `PUBLIC`, `PRIVATE`, mặc định `PUBLIC`).
- `view_count` (INT, mặc định `0`): Bộ đếm lượt xem video.
- `created_at`, `updated_at` (TIMESTAMPTZ(6)).
- **Chỉ mục (Index)**:
  - `idx_videos_user_id`: Tối ưu hóa truy vấn trang cá nhân (Profile feed).
  - `idx_videos_created_at_desc`: Tối ưu hóa bảng tin "For You" (FYP) theo thời gian mới nhất.

### 2.3. `likes` (Lượt thích video)
- `user_id` (UUID, Foreign Key -> `users.id`, `ON DELETE CASCADE`).
- `video_id` (UUID, Foreign Key -> `videos.id`, `ON DELETE CASCADE`).
- `created_at` (TIMESTAMPTZ(6)).
- **Khóa chính kép**: `PRIMARY KEY (user_id, video_id)` đảm bảo mỗi user chỉ có thể thả tim 1 lần cho 1 video.
- **Chỉ mục**: `idx_likes_video_id` tối ưu đếm tổng like của video.

### 2.4. `comments` (Bình luận & Trả lời bình luận đa tầng)
- `id` (UUID, Primary Key).
- `user_id` (UUID, Foreign Key -> `users.id`, `ON DELETE CASCADE`).
- `video_id` (UUID, Foreign Key -> `videos.id`, `ON DELETE CASCADE`).
- `content` (TEXT): Nội dung bình luận.
- `parent_comment_id` (UUID, Optional, Foreign Key -> `comments.id`, `ON DELETE CASCADE`): Bình luận cha để hỗ trợ trả lời (threaded comments / replies).
- `created_at`, `updated_at` (TIMESTAMPTZ(6)).
- **Chỉ mục**:
  - `idx_comments_video_id`: Lấy danh sách bình luận theo video.
  - `idx_comments_parent_comment_id`: Lấy các lượt phản hồi của bình luận.
  - `idx_comments_user_id`: Tra cứu bình luận theo người dùng.

### 2.5. `follows` (Quan hệ người theo dõi)
- `follower_id` (UUID, Foreign Key -> `users.id`, `ON DELETE CASCADE`): Người nhấn theo dõi.
- `following_id` (UUID, Foreign Key -> `users.id`, `ON DELETE CASCADE`): Người được theo dõi.
- `created_at` (TIMESTAMPTZ(6)).
- **Khóa chính kép**: `PRIMARY KEY (follower_id, following_id)`.
- **Ràng buộc toàn vẹn (CHECK constraint)**: `CHECK (follower_id <> following_id)` ngăn chặn tuyệt đối việc người dùng tự follow chính mình ngay từ tầng Database.

---

## 3. Cấu trúc thư mục Source Code

```
backend/
├── docker-compose.yml          # Cấu hình khởi động PostgreSQL 16 & pgAdmin 4
├── .env.example                # File mẫu biến môi trường (JWT, CORS, DATABASE_URL)
├── .env                        # File biến môi trường nội bộ (đã gitignore)
├── .gitignore                  # Bỏ qua node_modules, dist, .env
├── package.json                # Dependencies NestJS, Prisma, bcrypt, JWT, class-validator
├── tsconfig.json               # Cấu hình TypeScript ES2021
├── nest-cli.json               # Cấu hình Nest CLI
├── API_DOCUMENTATION.md        # Tài liệu chi tiết 18 Endpoints và Request/Response
├── postman_collection.json     # File Postman Collection sẵn sàng import
├── prisma/
│   ├── schema.prisma           # Định nghĩa 5 Models, Relations, Indexes, Enums
│   ├── seed.ts                 # Script nạp dữ liệu mẫu an toàn (idempotent upsert)
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20261013160000_init_shortvibe_schema/
│           └── migration.sql   # File DDL migration chuẩn PostgreSQL
└── src/
    ├── app.module.ts           # Root module kết nối 6 feature modules
    ├── main.ts                 # Khởi chạy NestJS (Port 3000, CORS, ValidationPipe)
    ├── common/
    │   ├── decorators/         # @CurrentUser()
    │   ├── guards/             # JwtAuthGuard, OptionalJwtAuthGuard
    │   └── dto/                # PaginationQueryDto
    ├── prisma/                 # PrismaService & PrismaModule
    ├── auth/                   # POST register, login; GET me; JwtStrategy
    ├── users/                  # GET :id, PATCH me, GET :id/videos, followers, following
    ├── videos/                 # GET feed, :id; POST; PATCH :id; DELETE :id
    ├── likes/                  # POST :id/likes, DELETE :id/likes, GET :id/likes
    ├── comments/               # GET & POST :id/comments; PATCH & DELETE /comments/:id
    └── follows/                # POST & DELETE :id/follow; GET :id/follow-status
```

---

## 4. Hướng dẫn chạy kiểm thử (Unit Tests)

Dự án đã tích hợp Jest với đầy đủ 22 bài kiểm thử tự động cho toàn bộ các quy tắc nghiệp vụ (bảo mật mật khẩu, phân quyền video riêng tư, khóa ngoại, chống tự follow, kiểm soát xóa bình luận):

```powershell
cd d:\HKDN_MOBLIEAPP\ShortVibe\backend
npm test
```

---

## 5. Hướng dẫn triển khai và vận hành trên Windows PowerShell

### Bước 1: Khởi động Cơ sở dữ liệu PostgreSQL
- **Cách 1 (Docker Desktop)**:
  ```powershell
  docker compose up -d
  ```
- **Cách 2 (PostgreSQL Local / Cloud Neon/Supabase)**:
  Cập nhật file `.env` với chuỗi `DATABASE_URL` thực tế.

### Bước 2: Chạy Migration & Nạp dữ liệu mẫu
```powershell
npx prisma migrate dev
npm run prisma:seed
```

### Bước 3: Khởi động NestJS Backend
```powershell
npm run start:dev
```
Server sẽ chạy tại: `http://localhost:3000`.

---

## 6. Kiểm thử API bằng Postman

Import file `backend/postman_collection.json` vào Postman:
1. Mở Postman -> Chọn **Import** -> Chọn file [postman_collection.json](file:///d:/HKDN_MOBLIEAPP/ShortVibe/backend/postman_collection.json).
2. Chạy request **Auth > Login** với tài khoản mẫu `alice_walker` / `ShortVibe@2026!`.
3. Script test tích hợp sẵn sẽ tự động lưu `accessToken` vào biến `token` của collection để phục vụ cho các request tiếp theo.

