import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OJT Tracker",
    short_name: "OJT",
    description: "Track your 486 OJT hours, daily journal, and weekly reports.",
    start_url: "/today",
    display: "standalone",
    background_color: "#F2F2F7",
    theme_color: "#0A4DA2",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
