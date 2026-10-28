"use client";

import React from "react";
import { Tag, Plus, Search, Edit3, Trash2, Check, ArrowRight } from "lucide-react";
import { Category, Product, StudioTab } from "../types";

interface CategoriesTabProps {
  categoriesList: Category[];
  productsList: Product[];
  categoryForm: {
    name: string;
    description: string;
    iconName: string;
  };
  setCategoryForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      description: string;
      iconName: string;
    }>
  >;
  handleAddCategory: (e: React.FormEvent) => void;
  categorySearchQuery: string;
  setCategorySearchQuery: (q: string) => void;
  editingCategoryId: string | null;
  setEditingCategoryId: (id: string | null) => void;
  editingCategoryName: string;
  setEditingCategoryName: (name: string) => void;
  handleUpdateCategory: (id: string, name: string) => void;
  handleDeleteCategory: (id: string, name: string) => void;
  setFilterCardCategory: (slug: string) => void;
  setActiveStudioTab: (tab: StudioTab) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  categoriesList,
  productsList,
  categoryForm,
  setCategoryForm,
  handleAddCategory,
  categorySearchQuery,
  setCategorySearchQuery,
  editingCategoryId,
  setEditingCategoryId,
  editingCategoryName,
  setEditingCategoryName,
  handleUpdateCategory,
  handleDeleteCategory,
  setFilterCardCategory,
  setActiveStudioTab,
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-stone-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Quản Lý Danh Mục */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <Tag className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Quản Lý Danh Mục Thẻ Bài Poly Cards
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              {categoriesList.length} Danh Mục
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-1 max-w-2xl">
            Tạo mới, chỉnh sửa và phân loại danh mục sản phẩm. Mỗi thẻ bài thuộc về một danh mục sẽ tự động được gom nhóm hiển thị trên trang chủ <strong className="text-amber-300">#products</strong> và bộ lọc <strong className="text-amber-300">/products</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: FORM THÊM MỚI DANH MỤC */}
        <div className="lg:col-span-5 xl:col-span-4">
          <form
            onSubmit={handleAddCategory}
            className="rounded-2xl bg-stone-900/90 border border-amber-500/30 p-5 space-y-4 shadow-xl shadow-amber-500/5 sticky top-4"
          >
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <div className="h-8 w-8 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                <Plus className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-300">Thêm Danh Mục Mới</h3>
                <p className="text-[10px] text-stone-400">Tạo phân loại mới cho các bộ thẻ tiếp theo</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Tên danh mục <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khủng Long, Côn Trùng, Nghề Nghiệp..."
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Mô tả ngắn danh mục:
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt nội dung học tập của danh mục này..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Biểu tượng đại diện:
                </label>
                <select
                  value={categoryForm.iconName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                >
                  <option value="Layers">Icon: Chung (Layers)</option>
                  <option value="PawPrint">Icon: Động Vật (PawPrint)</option>
                  <option value="Activity">Icon: Vận Động (Activity)</option>
                  <option value="Car">Icon: Phương Tiện (Car)</option>
                  <option value="Apple">Icon: Hoa Quả (Apple)</option>
                  <option value="Sparkles">Icon: Kỳ Ảo (Sparkles)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Tạo Danh Mục Mới</span>
              </button>
            </div>
          </form>
        </div>

        {/* CỘT PHẢI: DANH SÁCH CÁC DANH MỤC HIỆN TẠI */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-black text-stone-300 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-amber-400" />
              <span>Danh Sách Danh Mục ({categoriesList.length})</span>
            </div>
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
              <input
                type="text"
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
                placeholder="Tìm danh mục..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-stone-900 border border-white/15 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categoriesList
              .filter((cat) => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
              .map((cat) => {
                const cardCount = productsList.filter(
                  (p) => p.categorySlug === cat.slug || p.category === cat.name
                ).length;
                const isEditing = editingCategoryId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="rounded-2xl bg-stone-900/80 border border-white/10 hover:border-amber-500/30 p-4 space-y-2.5 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-bold">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                className="bg-black border border-amber-400 rounded-lg px-2 py-0.5 text-xs text-white font-bold"
                                autoFocus
                              />
                            ) : (
                              <h4 className="font-black text-sm text-white">{cat.name}</h4>
                            )}
                            <span className="text-[10px] text-stone-400 font-mono">slug: {cat.slug}</span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-stone-300 font-mono">
                          {cardCount} Thẻ
                        </span>
                      </div>

                      <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">
                        {cat.description || "Danh mục thẻ học tương tác Poly Cards"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCategory(cat.id, editingCategoryName)}
                            className="py-1 px-2.5 rounded-lg bg-emerald-500 text-stone-950 font-black text-xs flex items-center gap-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>Lưu</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryId(null)}
                            className="py-1 px-2 rounded-lg bg-white/10 text-stone-300 font-bold text-xs"
                          >
                            Hủy
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditingCategoryName(cat.name);
                            }}
                            className="py-1 px-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="h-3 w-3 text-sky-400" />
                            <span>Sửa</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="py-1 px-2 rounded-lg bg-white/5 hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Xóa</span>
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setFilterCardCategory(cat.slug);
                          setActiveStudioTab("products");
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <span>Xem thẻ ({cardCount})</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
