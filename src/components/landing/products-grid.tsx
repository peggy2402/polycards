import React from "react";
import { Animal } from "@/types/animal";
import { ProductCard } from "./product-card";
import { Sparkles, Layers } from "lucide-react";

interface ProductsGridProps {
  animals: Animal[];
}

export function ProductsGrid({ animals }: ProductsGridProps) {
  return (
    <section id="products" className="scroll-mt-20 py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-sky-50/20 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-4 py-1.5 text-xs font-bold text-amber-950 border border-amber-300">
            <Layers className="h-4 w-4 text-amber-600" />
            <span>Bộ Sưu Tập Thẻ Học Thông Minh</span>
          </div>

          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            Khám Phá Thế Giới Động Vật Poly Cards
          </h2>

          <p className="mt-3 text-base text-stone-700 sm:text-lg">
            Thẻ bài chất liệu chống nước cao cấp, hình ảnh 3D hoạt hình sống động, tích hợp phát âm chuẩn 3 ngôn ngữ (Anh - Việt - Trung) và mã QR AR.
          </p>
        </div>

        {/* Responsive Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {animals.map((animal) => (
            <ProductCard key={animal.id} animal={animal} />
          ))}
        </div>

        {/* Note under grid */}
        <div className="mt-12 rounded-2xl border-2 border-amber-200/80 bg-white/90 p-4 text-center text-xs font-bold text-slate-700 shadow-sm backdrop-blur-md">
          <p className="flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span>Mỗi thẻ bài đều đi kèm mã QR riêng biệt và quyền truy cập không giới hạn vào trải nghiệm AR tương tác 3D.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
