import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "İnşaat Günlükleri",
  description: "Şantiye ve taşeron takip programı",
  applicationName: "İnşaat Günlükleri",
  appleWebApp: { capable: true, title: "İnşaat Günlükleri", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#ffb627",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
