import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// __SW_MANIFEST is injected by serwist at service-worker build time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const manifest = (self as any).__SW_MANIFEST;

const serwist = new Serwist({
  precacheEntries: manifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
