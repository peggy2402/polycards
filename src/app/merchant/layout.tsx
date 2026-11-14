import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Poly Merchant - Nhận Đơn Hàng Live",
  description: "Ứng dụng nhận đơn và chốt đơn hàng Poly Cards theo thời gian thực",
  manifest: "/merchant-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Poly Merchant",
  },
  icons: {
    apple: "/apple-icon.png",
  },
};

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Các thẻ link & meta PWA tối ưu đặc thù cho iOS Safari Add to Home Screen */}
      <head>
        <link rel="manifest" href="/merchant-manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Poly Merchant" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      {children}
    </>
  );
}

