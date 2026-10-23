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
    primary: "bg-amber-100 text-amber-900 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    secondary: "bg-emerald-100 text-emerald-900 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    accent: "bg-sky-100 text-sky-900 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    outline: "bg-white/80 backdrop-blur-sm text-stone-700 border border-stone-200 dark:bg-stone-900/80 dark:text-stone-300 dark:border-stone-700",
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
