"use client";

import React from "react";
import { X, PackageCheck, Layers, Eye, Sliders, ExternalLink, QrCode } from "lucide-react";
import { Animal } from "@/types/animal";
import { formatVndCurrency } from "@/lib/formatters";

interface PackCardsModalProps {
  isOpen: boolean;
  packCode: string;
  cards: Animal[];
  onClose: () => void;
  onLoadCardToCanvas?: (card: Animal) => void;
}

export function PackCardsModal({
  isOpen,
  packCode,
  cards,
  onClose,
  onLoadCardToCanvas,
}: PackCardsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-purple-400/40 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl shadow-purple-950/40 overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center font-black">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">
                  Danh Sách Thẻ Bài Thuộc Bộ
                </h3>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50">
                  {packCode}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Tổng cộng có <strong className="text-amber-400">{cards.length}</strong> thẻ bài đang được gắn mã bộ này
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Danh sách thẻ dạng Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
          {cards.length === 0 ? (
            <div className="p-12 text-center text-stone-500 space-y-2">
              <Layers className="h-10 w-10 text-stone-600 mx-auto" />
              <p className="text-sm">Chưa có thẻ bài nào được gán mã bộ này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {cards.map((card, idx) => {
                const img =
                  card.posterUrl ||
                  (Array.isArray(card.images) && card.images[0]) ||
                  "/images/cards/lion-template.jpg";

                return (
                  <div
                    key={card.slug || idx}
                    className="group rounded-2xl bg-black/50 border border-white/10 overflow-hidden hover:border-purple-400/50 transition-all flex flex-col"
                  >
                    <div className="aspect-[3/4] w-full bg-stone-800 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={card.nameVi}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-1.5 left-1.5 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-stone-300">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                      <div>
                        <h4 className="text-xs font-bold text-white truncate" title={card.nameVi}>
                          {card.nameVi}
                        </h4>
                        <p className="text-[10px] text-stone-400 truncate">
                          {card.nameEn || card.slug}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="font-mono text-amber-300 font-bold">
                          {formatVndCurrency(card.price || 219000)}
                        </span>

                        {onLoadCardToCanvas && (
                          <button
                            type="button"
                            onClick={() => {
                              onLoadCardToCanvas(card);
                              onClose();
                            }}
                            className="text-[10px] font-bold text-purple-300 hover:text-white flex items-center gap-0.5"
                            title="Nạp vào Bàn Chế Bản & QR"
                          >
                            <Sliders className="h-3 w-3" />
                            <span>Chế bản</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-stone-950/60 flex items-center justify-between text-xs">
          <span className="text-stone-400">
            Mẹo: Quét mã QR trên bất kỳ thẻ nào trong bộ này sẽ tự động mở khóa cả bộ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
