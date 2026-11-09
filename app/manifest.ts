import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ExpertsEarn",
    short_name: "ExpertsEarn",
    description: "Answer. Earn. Repeat.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F9FAFB",
    theme_color: "#1B4332",
    orientation: "portrait",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }]
  };
}
