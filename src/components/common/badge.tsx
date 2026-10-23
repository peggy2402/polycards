import React from "react";
import { Sparkles, Star, Flame, CheckCircle2 } from "lucide-react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent" | "outline";
  icon?: "sparkles" | "star" | "flame" | "check";
  className?: string;
}

export function Badge({
  children,
  variant = "primary",
  icon,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-amber-100 text-amber-950 border border-amber-300 font-extrabold",
    secondary: "bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold",
    accent: "bg-sky-100 text-sky-950 border border-sky-300 font-extrabold",
    outline: "bg-white/95 backdrop-blur-sm text-slate-800 border border-amber-200 font-extrabold",
  };

  const renderIcon = () => {
    switch (icon) {
      case "sparkles":
        return <Sparkles className="w-3.5 h-3.5" />;
      case "star":
        return <Star className="w-3.5 h-3.5" />;
      case "flame":
        return <Flame className="w-3.5 h-3.5" />;
      case "check":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase shadow-xs transition-colors ${variantStyles[variant]} ${className}`}
    >
      {renderIcon()}
      <span>{children}</span>
    </span>
  );
}
