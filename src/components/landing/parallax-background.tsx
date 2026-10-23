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
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Parallax Floating Orb 1: Warm Sunny Amber */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.18}px, 0)`,
        }}
        className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-gradient-to-br from-amber-300/35 to-yellow-200/20 blur-3xl transition-transform duration-75"
      />

      {/* Parallax Floating Orb 2: Clear Sky Blue */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * -0.15}px, 0)`,
        }}
        className="absolute top-1/4 -right-28 h-[32rem] w-[32rem] rounded-full bg-gradient-to-bl from-sky-300/30 to-blue-200/20 blur-3xl transition-transform duration-75"
      />

      {/* Parallax Floating Orb 3: Fresh Meadow Emerald */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.12}px, 0)`,
        }}
        className="absolute top-2/3 left-1/3 h-80 w-80 rounded-full bg-gradient-to-tr from-emerald-300/25 to-teal-200/20 blur-3xl transition-transform duration-75"
      />

      {/* Floating Sparkle Elements moving at different speeds */}
      <div
        style={{
          transform: `translate3d(0, ${scrollY * -0.25}px, 0) rotate(${scrollY * 0.05}deg)`,
        }}
        className="absolute top-1/3 left-8 text-amber-400/50 hidden md:block"
      >
        <Sparkles className="h-8 w-8 animate-pulse" />
      </div>

      <div
        style={{
          transform: `translate3d(0, ${scrollY * 0.22}px, 0) rotate(${scrollY * -0.05}deg)`,
        }}
        className="absolute top-1/2 right-12 text-emerald-400/40 hidden md:block"
      >
        <Sparkles className="h-10 w-10 animate-pulse" />
      </div>
    </div>
  );
}
