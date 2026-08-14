"use client";

import { useEffect, useState } from "react";
import { WifiSlash, WifiHigh } from "@phosphor-icons/react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setShowReconnected(false);
    };

    // Check initial state
    if (typeof window !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (showReconnected) {
    return (
      <div className="sticky top-0 z-50 bg-emerald-400 text-black border-b-2 border-black px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2 shadow-[0_2px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top duration-200">
        <WifiHigh size={16} weight="bold" />
        <span>Koneksi internet terhubung kembali.</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div className="sticky top-0 z-50 bg-rose-400 text-black border-b-2 border-black px-4 py-1.5 text-xs font-black flex items-center justify-center gap-2 shadow-[0_2px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top duration-200">
      <WifiSlash size={16} weight="bold" />
      <span>
        Anda sedang offline. Beberapa data mungkin tidak dapat diperbarui hingga koneksi internet kembali normal.
      </span>
    </div>
  );
}
