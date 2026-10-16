# ShortVibe REST API Documentation

Tài liệu chi tiết toàn bộ các Endpoint của Backend API ShortVibe, được thiết kế chuẩn RESTful cho cả **Web ReactJS** và **Mobile ReactJS + Capacitor**.

---

## 1. Thông tin chung

- **Base URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **Xác thực**: JSON Web Token (JWT) gửi qua Header:
  ```http
  Authorization: Bearer <your_access_token>
  ```
- **CORS**: Được bật mặc định cho phép các Client Web và Mobile gọi API.

---

## 2. Chi tiết Endpoints

### 🔐 A. Auth Module (`/auth`)

#### 1. `POST /auth/register` — Đăng ký tài khoản mới
- **Quyền**: Public
- **Request Body**:
  ```json
  {
    "username": "minh_creator",
    "email": "minh@shortvibe.app",
    "password": "Password123!",
    "displayName": "Minh Creator",
    "bio": "Short video creator 🎥"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Account registered successfully",
    "user": {
      "id": "c71a3964-b52e-4b2a-89a1-778899aabbcc",
      "username": "minh_creator",
      "email": "minh@shortvibe.app",
      "displayName": "Minh Creator",
      "avatarUrl": null,
      "bio": "Short video creator 🎥",
      "createdAt": "2026-10-13T16:30:00.000Z",
      "updatedAt": "2026-10-13T16:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 2. `POST /auth/login` — Đăng nhập
- **Quyền**: Public
- **Request Body**:
  ```json
  {
    "usernameOrEmail": "minh_creator",
    "password": "Password123!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Logged in successfully",
    "user": {
      "id": "c71a3964-b52e-4b2a-89a1-778899aabbcc",
      "username": "minh_creator",
      "email": "minh@shortvibe.app",
      "displayName": "Minh Creator",
      "avatarUrl": null,
      "bio": "Short video creator 🎥"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

#### 3. `GET /auth/me` — Lấy thông tin tài khoản hiện tại
- **Quyền**: Yêu cầu Bearer Token
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "id": "c71a3964-b52e-4b2a-89a1-778899aabbcc",
    "username": "minh_creator",
    "email": "minh@shortvibe.app",
    "displayName": "Minh Creator",
    "avatarUrl": null,
    "bio": "Short video creator 🎥",
    "_count": {
      "videos": 12,
      "followers": 150,
      "following": 45
    }
  }
  ```

---

### 👤 B. Users Module (`/users`)

#### 1. `GET /users/:id` — Xem hồ sơ người dùng
- **Quyền**: Public (Nếu truyền token sẽ nhận thêm trường `isFollowing`)
- **Response (200 OK)**:
  ```json
  {
    "id": "11111111-1111-4111-a111-111111111111",
    "username": "alice_walker",
    "displayName": "Alice Walker",
    "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
    "bio": "Travel enthusiast ✨",
    "createdAt": "2026-10-13T16:00:00.000Z",
    "_count": {
      "videos": 3,
      "followers": 4,
      "following": 2
    },
    "isFollowing": true
  }
  ```

#### 2. `PATCH /users/me` — Cập nhật hồ sơ của chính mình
- **Quyền**: Yêu cầu Bearer Token
- **Request Body**:
  ```json
  {
    "displayName": "Alice Official",
    "bio": "Updated bio here",
    "avatarUrl": "https://example.com/new-avatar.jpg"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Profile updated successfully",
    "user": { ... }
  }
  ```

#### 3. `GET /users/:id/videos` — Danh sách video của người dùng
- **Quyền**: Public (Chỉ hiển thị PUBLIC trừ khi người xem chính là tác giả)
- **Query Params**: `?page=1&limit=10`
- **Response (200 OK)**:
  ```json
  {
    "data": [ ... ],
    "meta": { "total": 3, "page": 1, "limit": 10, "totalPages": 1 }
  }
  ```

#### 4. `GET /users/:id/followers` — Danh sách người theo dõi
- **Query Params**: `?page=1&limit=20`

#### 5. `GET /users/:id/following` — Danh sách đang theo dõi
- **Query Params**: `?page=1&limit=20`

---

### 🎬 C. Videos Module (`/videos`)

#### 1. `GET /videos` — Bảng tin video (Feed)
- **Quyền**: Public (Nếu có token sẽ biết bản thân đã thích video nào qua `isLiked`)
- **Query Params**: `?page=1&limit=10`
- **Sắp xếp**: Mới nhất trước (`createdAt DESC`)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "aaaaaaa3-3333-4aaa-aaaa-333333333333",
        "userId": "44444444-4444-4444-a444-444444444444",
        "caption": "Building production-grade NestJS + Prisma backend 🚀",
        "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "thumbnailUrl": "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600",
        "durationSeconds": 35,
        "visibility": "PUBLIC",
        "viewCount": 5611,
        "isLiked": false,
        "likeCount": 4,
        "commentCount": 3,
        "user": {
          "id": "44444444-4444-4444-a444-444444444444",
          "username": "diana_dev",
          "displayName": "Diana Dev",
          "avatarUrl": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200"
        }
      }
    ],
    "meta": {
      "total": 9,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

#### 2. `GET /videos/:id` — Xem chi tiết video
- Tự động tăng `viewCount` nguyên tử (+1).
- Nếu video là `PRIVATE`, chỉ có tác giả mới được xem (khách khác nhận 403 Forbidden).

#### 3. `POST /videos` — Đăng video mới
- **Quyền**: Yêu cầu Bearer Token (Tự động gán `userId` từ JWT)
- **Request Body**:
  ```json
  {
    "caption": "My first ShortVibe video! #vibe #first",
    "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "thumbnailUrl": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600",
    "durationSeconds": 15,
    "visibility": "PUBLIC"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Video published successfully",
    "video": { ... }
  }
  ```

#### 4. `PATCH /videos/:id` — Sửa video
- **Quyền**: Chỉ tác giả của video (403 nếu người khác sửa)
- **Request Body**: `caption`, `thumbnailUrl`, `visibility`

#### 5. `DELETE /videos/:id` — Xóa video
- **Quyền**: Chỉ tác giả của video (403 nếu người khác xóa)

---

### ❤️ D. Likes Module (`/videos/:id/likes`)

#### 1. `POST /videos/:id/likes` — Thích video
- **Quyền**: Yêu cầu Bearer Token
- Xử lý idempotent: Không bị lỗi duplicate khi nhấn nhiều lần.
- **Response (200 OK)**:
  ```json
  {
    "message": "Video liked successfully",
    "isLiked": true,
    "totalLikes": 15
  }
  ```

#### 2. `DELETE /videos/:id/likes` — Bỏ thích video
- **Quyền**: Yêu cầu Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "message": "Video unliked successfully",
    "isLiked": false,
    "totalLikes": 14
  }
  ```

#### 3. `GET /videos/:id/likes` — Lấy trạng thái thích
- **Response (200 OK)**:
  ```json
  {
    "videoId": "aaaaaaa3-3333-4aaa-aaaa-333333333333",
    "totalLikes": 15,
    "isLiked": true
  }
  ```

---

### 💬 E. Comments Module

#### 1. `GET /videos/:id/comments` — Lấy bình luận có phân trang
- **Query Params**: `?page=1&limit=20` (hoặc `?parentCommentId=<id>` để lấy các phản hồi con)
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "c1111111-1111-4111-a111-111111111111",
        "content": "This tutorial is super clean and easy to follow! 🙌",
        "replyCount": 2,
        "isOwner": false,
        "user": {
          "id": "11111111-1111-4111-a111-111111111111",
          "username": "alice_walker",
          "displayName": "Alice Walker",
          "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200"
        }
      }
    ],
    "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
  ```

#### 2. `POST /videos/:id/comments` — Thêm bình luận
- **Quyền**: Yêu cầu Bearer Token
- **Request Body (Bình luận gốc)**:
  ```json
  {
    "content": "Awesome content, keep it up!"
  }
  ```
- **Request Body (Trả lời bình luận khác)**:
  ```json
  {
    "content": "I completely agree with you!",
    "parentCommentId": "c1111111-1111-4111-a111-111111111111"
  }
  ```

#### 3. `PATCH /comments/:id` — Sửa bình luận
- **Quyền**: Chỉ người tạo bình luận mới được sửa (403 nếu người khác sửa).

#### 4. `DELETE /comments/:id` — Xóa bình luận
- **Quyền**: Người tạo bình luận **HOẶC** tác giả của video chứa bình luận đều có quyền xóa.

---

### 👥 F. Follows Module (`/users/:id`)

#### 1. `POST /users/:id/follow` — Theo dõi người dùng
- **Quyền**: Yêu cầu Bearer Token
- Ràng buộc: Ngăn chặn tự theo dõi chính mình (Trả về `400 Bad Request`).
- **Response (200 OK)**:
  ```json
  {
    "message": "You are now following @bob_creator",
    "isFollowing": true,
    "followersCount": 43
  }
  ```

#### 2. `DELETE /users/:id/follow` — Bỏ theo dõi
- **Quyền**: Yêu cầu Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "message": "You unfollowed @bob_creator",
    "isFollowing": false,
    "followersCount": 42
  }
  ```

#### 3. `GET /users/:id/follow-status` — Kiểm tra trạng thái theo dõi
- **Quyền**: Yêu cầu Bearer Token
- **Response (200 OK)**:
  ```json
  {
    "targetUserId": "22222222-2222-4222-a222-222222222222",
    "username": "bob_creator",
    "isFollowing": true,
    "followersCount": 43,
    "followingCount": 12
  }
  ```

---

## 3. Mã trạng thái HTTP tiêu chuẩn

| Mã | Ý nghĩa | Ví dụ ứng dụng trong ShortVibe |
| :--- | :--- | :--- |
| **200 OK** | Thành công | Login, xem video, feed, like, unfollow |
| **201 Created** | Tạo mới thành công | Đăng ký tài khoản, đăng video, đăng bình luận |
| **400 Bad Request** | Dữ liệu gửi lên không hợp lệ | Tự follow chính mình, ID không đúng định dạng UUID, thiếu nội dung bình luận |
| **401 Unauthorized** | Chưa đăng nhập hoặc Token sai/hết hạn | Thiếu Bearer Token khi gọi API yêu cầu bảo vệ |
| **403 Forbidden** | Không có quyền truy cập | Sửa/xóa video hoặc bình luận của người khác, xem video PRIVATE của người khác |
| **404 Not Found** | Không tìm thấy tài nguyên | Video, Comment hoặc User không tồn tại |
| **409 Conflict** | Xung đột dữ liệu | Trùng Username hoặc Email khi đăng ký |
