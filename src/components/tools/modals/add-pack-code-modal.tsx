"use client";

import React, { useState, useRef } from "react";
import {
  X,
  PackageCheck,
  Plus,
  Tag,
  FileText,
  UploadCloud,
  Link2,
  Trash2,
  Loader2,
  ImageIcon,
  AlertCircle,
} from "lucide-react";
import { ProductCategory } from "@/types/animal";
import { saveNewPackCode, PackCodeItem } from "@/lib/pack-codes-store";

interface AddPackCodeModalProps {
  isOpen: boolean;
  categoriesList: ProductCategory[];
  onClose: () => void;
  onCreated: (newPack: PackCodeItem) => void;
}

export function AddPackCodeModal({
  isOpen,
  categoriesList,
  onClose,
  onCreated,
}: AddPackCodeModalProps) {
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    categoriesList[0]?.slug || "hanh-dong"
  );
  const [description, setDescription] = useState<string>("");

  // Ảnh đại diện bộ thẻ (Thumbnail)
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Xử lý upload file ảnh (dùng chung cho Chọn tệp và Drag & Drop)
  const handleUploadFile = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WebP...)");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const ext = file.name.split(".").pop() || "png";
      const cleanCode = (code || "pack").toLowerCase().replace(/[^a-z0-9]/g, "-");
      formData.append("filename", `pack-${cleanCode}-${Date.now()}.${ext}`);

      const res = await fetch("/api/tools/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.fileUrl) {
        setImageSrc(data.fileUrl);
      } else {
        setUploadError(data.error || "Không thể tải ảnh lên. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setUploadError(err.message || "Lỗi khi upload tệp ảnh");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, "-");
    const matchedCategory = categoriesList.find((c) => c.slug === selectedCategorySlug);
    const categoryName = matchedCategory ? matchedCategory.name : "Khác";

    const newPack: Omit<PackCodeItem, "createdAt"> = {
      code: cleanCode,
      name: name.trim() || `Bộ Thẻ ${cleanCode}`,
      categorySlug: selectedCategorySlug,
      categoryName,
      description: description.trim() || undefined,
      imageSrc: imageSrc.trim() || undefined,
    };

    const updated = saveNewPackCode(newPack);
    const found = updated.find((p) => p.code === cleanCode) || {
      ...newPack,
      createdAt: new Date().toLocaleDateString("vi-VN"),
    };

    onCreated(found);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-purple-400/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl shadow-purple-950/40 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-black">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-white">
                Thêm Mã Bộ Sản Phẩm Mới
              </h3>
              <p className="text-[11px] text-stone-400">
                Tạo mã bộ trong kho để gán thẻ và lập phiếu bán hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mã Bộ */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Mã Bộ (Pack Code) *:
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ví dụ: POLY30-HANHDONG-02, POLY30-CONTRUNG..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-purple-300 font-mono font-bold placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              Mã này sẽ được nhúng vào QR của các thẻ thuộc bộ này.
            </span>
          </div>

          {/* Tên Bộ Thẻ */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Tên Bộ Thẻ Sản Phẩm:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Bộ 30 Thẻ AR Côn Trùng & Sinh Vật..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
          </div>

          {/* Danh mục tương ứng */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Thuộc Danh Mục:
            </label>
            <select
              value={selectedCategorySlug}
              onChange={(e) => setSelectedCategorySlug(e.target.value)}
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:border-purple-400 cursor-pointer"
            >
              {categoriesList.map((cat) => (
                <option key={cat.id || cat.slug} value={cat.slug} className="bg-stone-900 text-white">
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* ẢNH ĐẠI DIỆN BỘ THẺ: CHỌN TỆP, PASTE LINK, DRAG & DROP */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4" />
                <span>Ảnh Đại Diện Bộ Thẻ (Thumbnail)</span>
              </span>
              {imageSrc && (
                <button
                  type="button"
                  onClick={() => setImageSrc("")}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Xóa ảnh</span>
                </button>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              {/* Preview Thumbnail */}
              <div className="sm:col-span-4 flex flex-col items-center">
                <div className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-stone-950 border border-white/15 flex items-center justify-center shadow-inner">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Thumbnail xem trước"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-stone-500 p-3 text-center">
                      <ImageIcon className="h-6 w-6 text-stone-600" />
                      <span className="text-[10px] font-medium leading-tight">
                        Chưa có ảnh (Dùng mặc định)
                      </span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex flex-col items-center justify-center text-purple-300 gap-1.5 z-10">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-[10px] font-bold">Đang tải ảnh...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload: Drag & Drop + File + Paste link */}
              <div className="sm:col-span-8 space-y-2.5">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                    isDragging
                      ? "border-purple-400 bg-purple-500/15 scale-[1.01]"
                      : "border-white/20 bg-stone-950/60 hover:border-purple-400/60 hover:bg-stone-950"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadFile(file);
                    }}
                    className="hidden"
                  />
                  <UploadCloud className={`h-5 w-5 ${isDragging ? "text-purple-400" : "text-stone-400"}`} />
                  <div className="text-[11px] font-bold text-stone-200">
                    Kéo & thả ảnh vào đây, hoặc <span className="text-purple-400 underline">Chọn tệp</span>
                  </div>
                  <div className="text-[9px] text-stone-500">
                    Hỗ trợ PNG, JPG, WebP (Tối đa 5MB)
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative">
                    <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type="text"
                      value={imageSrc}
                      onChange={(e) => setImageSrc(e.target.value)}
                      placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
                      className="w-full bg-stone-950 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-purple-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mô tả */}
          <div>
            <label className="block text-xs font-bold text-stone-300 mb-1">
              Ghi Chú / Mô Tả (tùy chọn):
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Đợt in ấn xưởng tháng 10/2026, quà tặng..."
              className="w-full bg-black/70 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-hidden focus:border-purple-400"
            />
          </div>

          {/* Nút hành động */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-stone-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-black shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isUploading ? "Đang tải ảnh..." : "Tạo & Lưu Mã Bộ"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
