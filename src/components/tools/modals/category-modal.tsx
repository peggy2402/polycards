"use client";

import React, { useState } from "react";
import {
  Sliders,
  X,
  Search,
  Plus,
  Edit3,
  Trash2,
  Check,
  Tag,
} from "lucide-react";
import { ProductCategory } from "@/types/animal";

interface CategoryModalProps {
  isOpen: boolean;
  categoriesList: ProductCategory[];
  onClose: () => void;
  onSaveCategory: (data: { name: string; description: string; iconName: string }) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (category: ProductCategory) => void;
}

export function CategoryModal({
  isOpen,
  categoriesList,
  onClose,
  onSaveCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoryModalProps) {
  const [searchCategoryQuery, setSearchCategoryQuery] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  if (!isOpen) return null;

  const filteredCategories = categoriesList.filter((c) =>
    c.name.toLowerCase().includes(searchCategoryQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchCategoryQuery.toLowerCase())
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;
    onSaveCategory({
      name: categoryName.trim(),
      description: categoryDesc.trim(),
      iconName: "Layers",
    });
    setCategoryName("");
    setCategoryDesc("");
  };

  const handleStartEdit = (cat: ProductCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingName.trim()) return;
    onUpdateCategory(id, editingName.trim());
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg animate-in fade-in">
      <div className="max-w-xl w-full max-h-[92dvh] sm:max-h-[85vh] bg-stone-900 border-2 border-amber-400/60 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-stone-900/90">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-amber-300">
                Quản Lý Danh Mục Sản Phẩm
              </h3>
              <p className="text-[11px] text-stone-400">
                Thêm mới, chỉnh sửa, xóa và tìm kiếm danh mục hiển thị trên Poly Cards
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 1. Form thêm mới danh mục */}
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-black/40 border border-amber-400/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-300">
              <Plus className="h-4 w-4 text-amber-400" />
              <span>Thêm Danh Mục Mới</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Tên danh mục <span className="text-rose-400">*</span>:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Đồ Chơi Gỗ, Trái Cây..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-300 mb-1">
                  Mô tả ngắn:
                </label>
                <input
                  type="text"
                  placeholder="Mô tả bộ sản phẩm..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs shadow-md shadow-amber-400/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm Vào Danh Mục</span>
              </button>
            </div>
          </form>

          {/* 2. Danh sách & Tìm kiếm danh mục */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-black text-stone-200">
                Danh Sách Hiện Có ({categoriesList.length} danh mục)
              </div>

              <div className="relative w-48 sm:w-60">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Tìm danh mục..."
                  value={searchCategoryQuery}
                  onChange={(e) => setSearchCategoryQuery(e.target.value)}
                  className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
              {filteredCategories.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500">
                  Không tìm thấy danh mục nào phù hợp.
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isEditing = editingId === cat.id;

                  return (
                    <div
                      key={cat.id}
                      className="p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                    >
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 bg-black/80 border border-amber-400 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(cat.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
                            title="Lưu tên mới"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-300 transition-colors cursor-pointer"
                            title="Hủy"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-mono text-amber-400/90 px-1.5 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/20">
                              {cat.slug}
                            </span>
                          </div>
                          {cat.description && (
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(cat)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-stone-400 hover:text-amber-300 transition-colors cursor-pointer"
                            title="Sửa tên danh mục"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteCategory(cat)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/20 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Xóa danh mục"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-stone-900/90 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-stone-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
