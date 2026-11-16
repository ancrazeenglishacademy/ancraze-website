import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ancraze English Academy",
    short_name: "Ancraze",
    description: "Best Spoken English Course in Bangla Language with 20 Codes Method",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2A0066",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
