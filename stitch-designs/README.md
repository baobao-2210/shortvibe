# ShortVibe - Google Stitch Design System

Tài liệu và mã nguồn giao diện trích xuất trực tiếp từ dự án **Google Stitch**:
- **Project Title**: TikTok-Style Video App UI
- **Project ID**: `7835354535722154786`
- **Device Type**: Desktop (1280px responsive)
- **Theme**: Dark Neon TikTok Vibe

---

## 1. Danh sách 4 Màn hình đã tải về

Toàn bộ file HTML và hình ảnh Screenshot chất lượng cao đã được tải về lưu trữ tại `stitch-designs/screens/`:

| Màn hình | ID Screen | File HTML | File Screenshot |
| :--- | :--- | :--- | :--- |
| **Bảng tin Dành cho bạn** (For You Feed) | `76fe739b03a04a2a9c2eb530fa2db45e` | [for_you_feed.html](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/for_you_feed.html) | [for_you_feed.png](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/for_you_feed.png) |
| **Chi tiết video & Bình luận** (Detail & Comments) | `99b6fcff0d4d4096bdf3344687cab9ef` | [video_detail.html](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/video_detail.html) | [video_detail.png](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/video_detail.png) |
| **Hồ sơ tác giả** (Creator Profile) | `35d09dc0553649059e99014fa7d63e14` | [creator_profile.html](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/creator_profile.html) | [creator_profile.png](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/creator_profile.png) |
| **Studio Tải lên video** (Upload Studio) | `3164d01a2320433fa141f7b7749e304f` | [upload_studio.html](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/upload_studio.html) | [upload_studio.png](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/screens/upload_studio.png) |

---

## 2. Bảng Design Tokens chuẩn hóa

### 🎨 Màu sắc (Color Palette)
- **Primary (TikTok Neon Pink/Red)**: `#fe2c55`
- **Primary Container**: `#ff5168`
- **Secondary (TikTok Cyber Cyan)**: `#00f2fe`
- **Secondary Container**: `#00f1fd`
- **Tertiary (Violet Neon)**: `#deb7ff` / `#b76dfd`
- **Nền chính (Dark Background)**: `#131316` (hoặc `#0f0f12`)
- **Các lớp bề mặt (Surfaces)**:
  - `surface-lowest`: `#0e0e11`
  - `surface-low`: `#1b1b1e`
  - `surface-container`: `#1f1f22`
  - `surface-high`: `#2a2a2d`
  - `surface-highest`: `#353438`
- **Text & Icons**:
  - `on-surface` (Chữ sáng): `#e4e1e6`
  - `on-surface-variant` (Chữ phụ/xám): `#e6bcbd`
  - `outline`: `#ad8889` / `#5d3f40`

### 🔤 Typography
- **Headline & Body Font**: `Inter` (`wght@400;500;600;700;800`)
- **Label / Tag Font**: `Space Grotesk` (`wght@600;700`)
- **Icon Set**: Google Material Symbols Outlined

### 📐 Bo góc (Border Radius)
- Hệ bo góc chuẩn `ROUND_EIGHT`:
  - Thẻ / Card: `16px` (`rounded-2xl`)
  - Nút bấm / Tag: `9999px` (`rounded-full`)
  - Ô nhập liệu (Input search): `9999px`
  - Thumbnail preview: `8px` (`rounded-lg`)

### 📏 Khoảng cách & Kích thước (Spacing & Layout)
- Thẻ Video: tỷ lệ chuẩn TikTok `9:16` (Width ~`480px`, Height ~`850px`).
- Sidebar Navigation trái: `width: 256px` (`w-64`), cố định (fixed).
- Header điều hướng trên: `height: 64px` (`h-16`), kính mờ `backdrop-blur-xl`.
- Cột thông tin / Bảng phím tắt phải: `width: 256px` (`w-64`).

---

## 3. Cách sử dụng Tokens trong dự án Frontend

- **CSS Variables**: Đã tạo sẵn tại [design-tokens.css](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/design-tokens.css), chỉ cần `@import` vào file `index.css` hoặc `App.css`.
- **JSON Tokens**: Lưu tại [design-tokens.json](file:///d:/HKDN_MOBLIEAPP/ShortVibe/stitch-designs/design-tokens.json), có thể nhúng trực tiếp vào cấu hình `tailwind.config.js` hoặc theme context của ReactJS.
