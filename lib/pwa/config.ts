export const PWA_CONFIG = {
  name: "Denycode Task Manager",
  shortName: "Denycode",
  description: "Aplikasi personal untuk mencatat, mengelola tugas, dan melihat linimasa deadline.",
  themeColor: "#FFD500",
  backgroundColor: "#FFFFFF",
  display: "standalone" as const,
  startUrl: "/",
  icons: [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};