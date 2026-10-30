"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  PackageCheck,
  Search,
  Filter,
  Copy,
  Check,
  Eye,
  Trash2,
  Sparkles,
  ExternalLink,
  Layers,
  User,
  Phone,
  Calendar,
  Receipt,
  Plus,
  X,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import { SeedOrderItem } from "@/data/seed-data";
import { Animal, ProductCategory } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";
import {
  getStoredPackCodes,
  saveNewPackCode,
  deleteStoredPackCode,
  PackCodeItem,
  PACK_CODES_UPDATED_EVENT,
} from "@/lib/pack-codes-store";
import { PackCardsModal } from "../modals/pack-cards-modal";
import { AddPackCodeModal } from "../modals/add-pack-code-modal";

interface LicensesTabProps {
  productsList: Animal[];
  categoriesList: ProductCategory[];
  onNavigateToPOS?: () => void;
  onLoadCardToCanvas?: (card: Animal) => void;
}

export function LicensesTab({
  productsList,
  categoriesList,
  onNavigateToPOS,
  onLoadCardToCanvas,
}: LicensesTabProps) {
  // Tab con: "STORE_PACKS" (Mã bộ trong kho) | "ISSUED_LICENSES" (Mã đã cấp qua Hóa Đơn)
  const [subTab, setSubTab] = useState<"STORE_PACKS" | "ISSUED_LICENSES">("STORE_PACKS");

  // 1. Dữ liệu Mã Bộ Sản Phẩm trong Kho
  const [packCodes, setPackCodes] = useState<PackCodeItem[]>([]);
  const [searchPackQuery, setSearchPackQuery] = useState<string>("");
  const [filterPackCategory, setFilterPackCategory] = useState<string>("all");

  // 2. Dữ liệu Mã Đã Cấp qua Đơn Hàng / Hóa Đơn
  const [orders, setOrders] = useState<SeedOrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [searchIssuedQuery, setSearchIssuedQuery] = useState<string>("");
  const [filterIssuedType, setFilterIssuedType] = useState<"ALL" | "SINGLE" | "MULTI" | "PACK">("ALL");

  // Phân trang (Pagination)
  const [pageSize, setPageSize] = useState<number>(6);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal xem danh sách thẻ trong bộ
  const [selectedPackForCards, setSelectedPackForCards] = useState<{
    code: string;
    cards: Animal[];
  } | null>(null);

  // Modal thêm mã bộ mới
  const [isAddPackModalOpen, setIsAddPackModalOpen] = useState<boolean>(false);

  // Modal chi tiết mã đã cấp
  const [selectedIssuedOrder, setSelectedIssuedOrder] = useState<SeedOrderItem | null>(null);
  const [issuedQrUrl, setIssuedQrUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Tải danh sách mã bộ trong kho
  const loadPackCodes = useCallback(() => {
    const stored = getStoredPackCodes();
    // Bổ sung các mã bộ xuất hiện trên productsList mà chưa có trong store
    const existingCodes = new Set(stored.map((p) => p.code.toUpperCase()));
    const fromProducts: PackCodeItem[] = [];

    productsList.forEach((prod) => {
      if (prod.packCode && prod.packCode.trim() !== "") {
        const codeUpper = prod.packCode.trim().toUpperCase();
        if (!existingCodes.has(codeUpper)) {
          existingCodes.add(codeUpper);
          fromProducts.push({
            code: codeUpper,
            name: `Bộ Thẻ ${codeUpper}`,
            categorySlug: prod.categorySlug || "dong-vat",
            categoryName: prod.category || "Động Vật",
            description: "Mã bộ gắn trực tiếp trên thẻ bài trong kho",
            createdAt: "Đã có trong kho",
          });
        }
      }
    });

    setPackCodes([...stored, ...fromProducts]);
  }, [productsList]);

  useEffect(() => {
    loadPackCodes();
    const handleUpdate = () => loadPackCodes();
    window.addEventListener(PACK_CODES_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(PACK_CODES_UPDATED_EVENT, handleUpdate);
  }, [loadPackCodes]);

  // Tải danh sách hóa đơn / đơn hàng từ backend
  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const res = await fetch("/api/orders");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setOrders(json.data);
        }
      }
    } catch (e) {
      console.warn("Lỗi tải orders:", e);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Reset trang về 1 khi đổi bộ lọc hoặc đổi tab con
  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, searchPackQuery, filterPackCategory, searchIssuedQuery, filterIssuedType, pageSize]);

  // Sinh QR Code cho modal chi tiết mã đã cấp
  useEffect(() => {
    if (selectedIssuedOrder && selectedIssuedOrder.directUrl) {
      QRCode.toDataURL(selectedIssuedOrder.directUrl, {
        width: 260,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setIssuedQrUrl(url))
        .catch(() => setIssuedQrUrl(""));
    } else {
      setIssuedQrUrl("");
    }
  }, [selectedIssuedOrder]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Đã sao chép mã: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Mở modal xem danh sách thẻ thuộc một mã bộ
  const handleOpenPackCards = (packCode: string) => {
    const matchedCards = productsList.filter(
      (p) => p.packCode && p.packCode.trim().toUpperCase() === packCode.trim().toUpperCase()
    );
    setSelectedPackForCards({
      code: packCode,
      cards: matchedCards,
    });
  };

  // Xóa mã bộ khỏi kho
  const handleDeletePackCode = (code: string) => {
    if (confirm(`Bạn có chắc muốn xóa mã bộ "${code}" khỏi kho lưu trữ không?`)) {
      deleteStoredPackCode(code);
      loadPackCodes();
      showToast(`Đã xóa mã bộ ${code}`);
    }
  };

  // 1. Lọc danh sách Mã Bộ Trong Kho
  const filteredPackCodes = useMemo(() => {
    return packCodes.filter((pack) => {
      const q = searchPackQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        pack.code.toLowerCase().includes(q) ||
        pack.name.toLowerCase().includes(q) ||
        (pack.description && pack.description.toLowerCase().includes(q));

      const matchesCat =
        filterPackCategory === "all" || pack.categorySlug === filterPackCategory;

      return matchesSearch && matchesCat;
    });
  }, [packCodes, searchPackQuery, filterPackCategory]);

  // 2. Lọc danh sách Mã Đã Cấp (Hóa Đơn / Khách Hàng)
  const filteredIssuedOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchIssuedQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.packTitle && o.packTitle.toLowerCase().includes(q));

      const type =
        o.codeType ||
        (o.code.startsWith("SINGLE-")
          ? "SINGLE"
          : o.code.startsWith("MULTI-")
          ? "MULTI"
          : "PACK");

      const matchesType = filterIssuedType === "ALL" || type === filterIssuedType;

      return matchesSearch && matchesType;
    });
  }, [orders, searchIssuedQuery, filterIssuedType]);

  // Phân trang cho tab hiện tại
  const currentItemsCount =
    subTab === "STORE_PACKS" ? filteredPackCodes.length : filteredIssuedOrders.length;
  const totalPages = Math.max(1, Math.ceil(currentItemsCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;

  const paginatedPackCodes = useMemo(() => {
    return filteredPackCodes.slice(startIndex, startIndex + pageSize);
  }, [filteredPackCodes, startIndex, pageSize]);

  const paginatedIssuedOrders = useMemo(() => {
    return filteredIssuedOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredIssuedOrders, startIndex, pageSize]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* HEADER TAB */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase text-white tracking-wide">
                Quản Lý Mã Thẻ &amp; Mã Bộ Bản Quyền
              </h2>
              <span className="text-[10px] bg-purple-500/30 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-400/40">
                {subTab === "STORE_PACKS"
                  ? `${packCodes.length} mã trong kho`
                  : `${orders.length} mã đã cấp`}
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Quản lý mã bộ sản phẩm chuẩn bị bán và các mã bản quyền WebAR đã xuất cho khách
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {subTab === "STORE_PACKS" ? (
            <button
              type="button"
              onClick={() => setIsAddPackModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Mã Bộ Mới</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToPOS}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Receipt className="h-4 w-4" />
              <span>Lập Hóa Đơn Mới (POS)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              loadPackCodes();
              loadOrders();
              showToast("Đã đồng bộ dữ liệu mới nhất!");
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition-colors"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2 TAB CON CHUYÊN BIỆT */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab("STORE_PACKS")}
          className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            subTab === "STORE_PACKS"
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "text-stone-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>1. Mã Bộ Sản Phẩm Trong Kho ({packCodes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("ISSUED_LICENSES")}
          className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${
            subTab === "ISSUED_LICENSES"
              ? "bg-amber-500 text-stone-950 shadow-lg shadow-amber-500/20"
              : "text-stone-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Receipt className="h-4 w-4" />
          <span>2. Mã Bản Quyền Đã Cấp / Bán ({orders.length})</span>
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: MÃ BỘ SẢN PHẨM TRONG KHO (CHƯA BÁN / SẴN SÀNG)
         ======================================================== */}
      {subTab === "STORE_PACKS" && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm & Lọc danh mục */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-2xl border border-white/10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Tìm mã bộ (POLY30-...), tên bộ thẻ..."
                value={searchPackQuery}
                onChange={(e) => setSearchPackQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterPackCategory}
                onChange={(e) => setFilterPackCategory(e.target.value)}
                className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-purple-400 cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {categoriesList.map((cat) => (
                  <option key={cat.id || cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Lựa chọn số lượng hiển thị trên trang */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-purple-400 cursor-pointer"
                title="Số mã trên 1 trang"
              >
                <option value={6}>Hiển thị 6 / trang</option>
                <option value={12}>Hiển thị 12 / trang</option>
                <option value={24}>Hiển thị 24 / trang</option>
                <option value={48}>Hiển thị 48 / trang</option>
              </select>
            </div>
          </div>

          {/* BẢNG MÃ BỘ TRONG KHO */}
          {filteredPackCodes.length === 0 ? (
            <div className="p-12 text-center text-stone-500 rounded-3xl bg-stone-900/40 border border-white/10 space-y-3">
              <PackageCheck className="h-12 w-12 text-stone-600 mx-auto" />
              <p className="text-sm">Không tìm thấy mã bộ nào trong kho phù hợp với bộ lọc.</p>
              <button
                type="button"
                onClick={() => setIsAddPackModalOpen(true)}
                className="py-2 px-4 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors border border-purple-500/30"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm mã bộ mới ngay</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-stone-900/60 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-stone-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-black">Mã Bộ (Pack Code)</th>
                      <th className="py-3 px-4 font-black">Tên Bộ Sản Phẩm</th>
                      <th className="py-3 px-4 font-black">Danh Mục</th>
                      <th className="py-3 px-4 text-center font-black">Số Thẻ Đang Gắn</th>
                      <th className="py-3 px-4 font-black">Trạng Thái</th>
                      <th className="py-3 px-4 text-right font-black">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedPackCodes.map((pack) => {
                      const countCards = productsList.filter(
                        (p) =>
                          p.packCode &&
                          p.packCode.trim().toUpperCase() === pack.code.trim().toUpperCase()
                      ).length;

                      return (
                        <tr key={pack.code} className="hover:bg-white/5 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                onClick={() => handleOpenPackCards(pack.code)}
                                className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-400/40 hover:bg-purple-500/30 transition-all cursor-pointer"
                                title="Bấm để xem danh sách thẻ trong bộ"
                              >
                                {pack.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(pack.code)}
                                className="p-1 rounded text-stone-500 hover:text-white"
                                title="Sao chép mã"
                              >
                                {copiedCode === pack.code ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white">
                            <div>{pack.name}</div>
                            {pack.description && (
                              <span className="text-[10px] text-stone-400 font-normal">
                                {pack.description}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-stone-300">
                              {pack.categoryName || pack.categorySlug}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleOpenPackCards(pack.code)}
                              className="inline-flex items-center gap-1 font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer"
                              title="Bấm để xem danh sách thẻ thuộc bộ này"
                            >
                              <Layers className="h-3 w-3" />
                              <span>{countCards} thẻ</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Sẵn sàng trong kho</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenPackCards(pack.code)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                                title="Xem danh sách các thẻ bài thuộc bộ này"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={onNavigateToPOS}
                                className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 transition-colors"
                                title="Lập hóa đơn bán bộ này tại POS"
                              >
                                <Receipt className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePackCode(pack.code)}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 transition-colors"
                                title="Xóa mã bộ khỏi kho"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* THANH PHÂN TRANG (PAGINATION) */}
              <div className="p-3 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
                <div>
                  Hiển thị{" "}
                  <strong className="text-white">
                    {filteredPackCodes.length === 0 ? 0 : startIndex + 1} -{" "}
                    {Math.min(startIndex + pageSize, filteredPackCodes.length)}
                  </strong>{" "}
                  trên tổng số <strong className="text-purple-300">{filteredPackCodes.length}</strong> mã bộ trong kho
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-200 font-mono font-bold text-xs">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: MÃ BẢN QUYỀN ĐÃ CẤP QUA HÓA ĐƠN POS / KHÁCH HÀNG
         ======================================================== */}
      {subTab === "ISSUED_LICENSES" && (
        <div className="space-y-4">
          {/* Thanh tìm kiếm & Lọc loại mã đã cấp */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-2xl border border-white/10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-500" />
              <input
                type="text"
                placeholder="Tìm mã bản quyền, tên khách hàng, SĐT..."
                value={searchIssuedQuery}
                onChange={(e) => setSearchIssuedQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterIssuedType}
                onChange={(e) => setFilterIssuedType(e.target.value as any)}
                className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-stone-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">Tất cả hình thức</option>
                <option value="SINGLE">Thẻ Đơn (SINGLE)</option>
                <option value="MULTI">Nhiều Thẻ (MULTI)</option>
                <option value="PACK">Trọn Bộ (PACK)</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-black/60 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-bold focus:outline-hidden focus:border-amber-400 cursor-pointer"
                title="Số mã trên 1 trang"
              >
                <option value={6}>Hiển thị 6 / trang</option>
                <option value={12}>Hiển thị 12 / trang</option>
                <option value={24}>Hiển thị 24 / trang</option>
                <option value={48}>Hiển thị 48 / trang</option>
              </select>
            </div>
          </div>

          {/* BẢNG MÃ ĐÃ CẤP */}
          {filteredIssuedOrders.length === 0 ? (
            <div className="p-12 text-center text-stone-500 rounded-3xl bg-stone-900/40 border border-white/10 space-y-3">
              <Receipt className="h-12 w-12 text-stone-600 mx-auto" />
              <p className="text-sm">Chưa có mã bản quyền nào được xuất bán qua POS.</p>
              <p className="text-xs text-stone-600">
                Khi bạn lập phiếu thu tiền tại POS, mã bản quyền tương ứng sẽ được tự động lưu vào đây.
              </p>
              <button
                type="button"
                onClick={onNavigateToPOS}
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs inline-flex items-center gap-1.5 transition-all shadow-md"
              >
                <Receipt className="h-4 w-4" />
                <span>Mở Phân Hệ POS để Lập Phiếu</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-stone-900/60 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-black/40 text-stone-400 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-black">Mã Bản Quyền</th>
                      <th className="py-3 px-4 font-black">Loại</th>
                      <th className="py-3 px-4 font-black">Khách Hàng</th>
                      <th className="py-3 px-4 font-black">Sản Phẩm Đã Mua</th>
                      <th className="py-3 px-4 text-right font-black">Doanh Thu</th>
                      <th className="py-3 px-4 font-black">Ngày Cấp</th>
                      <th className="py-3 px-4 text-right font-black">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {paginatedIssuedOrders.map((ord) => {
                      const type =
                        ord.codeType ||
                        (ord.code.startsWith("SINGLE-")
                          ? "SINGLE"
                          : ord.code.startsWith("MULTI-")
                          ? "MULTI"
                          : "PACK");

                      return (
                        <tr key={ord.id || ord.code} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-amber-300">
                                {ord.packCode || ord.code}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(ord.packCode || ord.code)}
                                className="p-1 rounded text-stone-500 hover:text-white"
                                title="Sao chép mã"
                              >
                                {copiedCode === (ord.packCode || ord.code) ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                type === "SINGLE"
                                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                                  : type === "MULTI"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {type === "SINGLE" ? "1 Thẻ Lẻ" : type === "MULTI" ? "Nhiều Thẻ" : "Trọn Bộ"}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <strong className="text-white block font-bold">{ord.customerName}</strong>
                            {ord.customerPhone && (
                              <span className="text-[10px] text-stone-400 font-mono">
                                {ord.customerPhone}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-bold text-stone-300 max-w-[200px] truncate">
                            {ord.packTitle || "Thẻ bài Poly Cards"}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-black text-amber-300">
                            {formatVndCurrency(ord.creditAmount || ord.totalPrice || 0)}
                          </td>

                          <td className="py-3 px-4 text-stone-400 text-[11px]">
                            {ord.createdAt}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedIssuedOrder(ord)}
                              className="py-1 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs inline-flex items-center gap-1 transition-colors border border-amber-500/30"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chi tiết</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* THANH PHÂN TRANG CHO MÃ ĐÃ CẤP */}
              <div className="p-3 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
                <div>
                  Hiển thị{" "}
                  <strong className="text-white">
                    {filteredIssuedOrders.length === 0 ? 0 : startIndex + 1} -{" "}
                    {Math.min(startIndex + pageSize, filteredIssuedOrders.length)}
                  </strong>{" "}
                  trên tổng số <strong className="text-amber-300">{filteredIssuedOrders.length}</strong> mã đã cấp
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang đầu"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang trước"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs">
                    {safeCurrentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang sau"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-stone-300 transition-colors"
                    title="Trang cuối"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL XEM DANH SÁCH THẺ TRONG BỘ */}
      {selectedPackForCards && (
        <PackCardsModal
          isOpen={Boolean(selectedPackForCards)}
          packCode={selectedPackForCards.code}
          cards={selectedPackForCards.cards}
          onClose={() => setSelectedPackForCards(null)}
          onLoadCardToCanvas={onLoadCardToCanvas}
        />
      )}

      {/* MODAL THÊM MÃ BỘ MỚI */}
      <AddPackCodeModal
        isOpen={isAddPackModalOpen}
        categoriesList={categoriesList}
        onClose={() => setIsAddPackModalOpen(false)}
        onCreated={(newPack) => {
          loadPackCodes();
          showToast(`Đã thêm mã bộ "${newPack.code}" thành công!`);
        }}
      />

      {/* MODAL CHI TIẾT MÃ BẢN QUYỀN ĐÃ CẤP */}
      {selectedIssuedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-stone-900 border border-amber-400/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-amber-300">
                    Chi Tiết Mã Kích Hoạt Bản Quyền
                  </h3>
                  <span className="text-[10px] text-stone-400">
                    Hóa đơn: {selectedIssuedOrder.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIssuedOrder(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-2">
              <span className="text-[10px] text-stone-400 uppercase font-bold block">
                Mã Kích Hoạt:
              </span>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl flex-1 break-all">
                  {selectedIssuedOrder.packCode || selectedIssuedOrder.code}
                </code>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedIssuedOrder.packCode || selectedIssuedOrder.code)}
                  className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  Chép
                </button>
              </div>
            </div>

            {/* Thông tin đơn hàng */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-stone-500 block">Khách hàng:</span>
                <strong className="text-white block mt-0.5">{selectedIssuedOrder.customerName}</strong>
                {selectedIssuedOrder.customerPhone && (
                  <span className="text-stone-400 font-mono text-[10px]">
                    {selectedIssuedOrder.customerPhone}
                  </span>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-stone-500 block">Thanh toán:</span>
                <strong className="text-amber-300 block font-mono mt-0.5">
                  {formatVndCurrency(selectedIssuedOrder.creditAmount || selectedIssuedOrder.totalPrice || 0)}
                </strong>
                <span className="text-stone-400 text-[10px]">
                  {selectedIssuedOrder.paymentMethod === "TIEN_MAT" ? "Tiền mặt" : "Chuyển khoản"}
                </span>
              </div>
            </div>

            {/* QR Test */}
            {issuedQrUrl && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center gap-3">
                <div className="h-20 w-20 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={issuedQrUrl} alt="QR Test" className="h-full w-full object-contain" />
                </div>
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-300 block">QR Kiểm Thử WebAR</span>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    Dùng camera điện thoại quét để kiểm tra khả năng mở khóa thẻ của mã này.
                  </p>
                  <a
                    href={selectedIssuedOrder.directUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    <span>Mở link trực tiếp</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIssuedOrder(null)}
                className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST THÔNG BÁO */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 border border-purple-400/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-bold animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
