import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Poly Cards - Thẻ Học Thực Tế Ảo WebAR 3D Cho Bé",
    short_name: "Poly Cards",
    description:
      "Bộ 270 thẻ học thực tế ảo WebAR 3D thông minh cho bé 3-8 tuổi. Chạm để xem mô hình 3D sống động, phát âm song ngữ Anh - Việt - Trung chuẩn bản xứ trực tiếp trên điện thoại.",
    start_url: "/",
    display: "standalone",
    background_color: "#181411",
    theme_color: "#f59e0b",
    orientation: "portrait",
    categories: ["education", "entertainment", "kids"],
    icons: [
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

