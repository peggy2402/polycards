"use client";

import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function ParallaxBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#FCFBF7]"
      aria-hidden="true"
    >
      {/* Parallax Floating Orb 1: Warm Golden Sunshine (Top-Left) */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.16}px, 0)`,
        }}
        className="absolute -top-24 -left-16 h-[36rem] w-[36rem] rounded-full bg-gradient-to-br from-amber-300/40 via-yellow-200/30 to-transparent blur-3xl transition-transform duration-75"
      />

      {/* Parallax Floating Orb 2: Clear Playful Sky (Top-Right) */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * -0.14}px, 0)`,
        }}
        className="absolute top-12 -right-20 h-[34rem] w-[34rem] rounded-full bg-gradient-to-bl from-sky-300/35 via-teal-200/25 to-transparent blur-3xl transition-transform duration-75"
      />

      {/* Parallax Floating Orb 3: Sweet Peach & Strawberry Candy (Mid-Section) */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.1}px, 0)`,
        }}
        className="absolute top-1/2 -left-20 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-rose-200/30 via-orange-100/20 to-transparent blur-3xl transition-transform duration-75"
      />

      {/* Parallax Floating Orb 4: Fresh Meadow Emerald (Bottom-Right) */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.12}px, 0)`,
        }}
        className="absolute top-2/3 right-1/4 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-emerald-300/30 via-teal-100/20 to-transparent blur-3xl transition-transform duration-75"
      />

      {/* Soft Floating Sparkles */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * -0.22}px, 0) rotate(${scrollY * 0.04}deg)`,
        }}
        className="absolute top-1/4 left-8 text-amber-400/70 hidden md:block"
      >
        <Sparkles className="h-8 w-8 animate-pulse" />
      </div>

      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.18}px, 0) rotate(${scrollY * -0.04}deg)`,
        }}
        className="absolute top-1/2 right-12 text-emerald-400/60 hidden md:block"
      >
        <Sparkles className="h-9 w-9 animate-pulse" />
      </div>
    </div>
  );
}
