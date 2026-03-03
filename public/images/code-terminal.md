# 0) Tạo base vuông 1024px từ logo lớn (giữ trong suốt, căng giữa)

magick public/logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 public/base-1024.png

# 1) Favicon PNG & ICO

magick public/base-1024.png -resize 32x32 public/favicon-32x32.png
magick public/base-1024.png -resize 16x16 public/favicon-16x16.png
magick public/base-1024.png -define icon:auto-resize="16,32,48" public/favicon.ico

# 2) Apple touch icon

magick public/base-1024.png -resize 180x180 public/apple-touch-icon.png

# 3) PWA / Android

magick public/base-1024.png -resize 192x192 public/icon-192.png
magick public/base-1024.png -resize 512x512 public/icon-512.png

# 4) Maskable (thêm “đệm an toàn” ~20% để không bị cắt khi mask)

magick public/logo.png -resize 800x800 -background none -gravity center -extent 1024x1024 public/maskable-1024.png
magick public/maskable-1024.png -resize 192x192 public/maskable-icon-192.png
magick public/maskable-1024.png -resize 512x512 public/maskable-icon-512.png

# 5) Ảnh chia sẻ mạng xã hội (OG 1200×630, nền màu thương hiệu)

# Đổi #2d2d2d thành màu của bạn và resize logo về ~720px cho cân đối

magick -size 1200x630 canvas:"#2d2d2d" \( public/logo.png -resize 720x720 \) -gravity center -composite public/og-default.jpg
