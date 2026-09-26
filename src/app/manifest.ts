import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "İnşaat Günlükleri",
    short_name: "Günlükler",
    description: "Şantiye ve taşeron takip programı",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffb627",
    lang: "tr",
    icons: [
      { src: "/ikon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
