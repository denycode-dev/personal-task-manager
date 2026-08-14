"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@phosphor-icons/react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return ("standalone" in window.navigator) && (window.navigator as Record<string, unknown>).standalone === true;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isIOS() && !isInStandaloneMode()) {
      const key = "ios_prompt_dismissed";
      if (!sessionStorage.getItem(key)) setShowIOS(true);
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    setShowIOS(false);
    sessionStorage.setItem("ios_prompt_dismissed", "1");
  };

  // Chrome/Edge/Android prompt
  if (installEvent && !dismissed) {
    return (
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 border-2 border-black bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="font-semibold text-sm">
            Install Denycode Task Manager di perangkat Anda untuk akses lebih cepat.
          </p>
          <button suppressHydrationWarning onClick={dismiss} className="flex-shrink-0"><X size={16} strokeWidth={3} /></button>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => installEvent.prompt()}>Install</Button>
          <Button size="sm" variant="outline" onClick={dismiss}>Nanti saja</Button>
        </div>
      </div>
    );
  }

  // iOS Safari manual guide
  if (showIOS && !dismissed) {
    return (
      <div className="fixed bottom-20 left-4 right-4 p-4 border-2 border-black bg-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-sm">Tambahkan ke Layar Utama</p>
          <button suppressHydrationWarning onClick={dismiss}><X size={16} strokeWidth={3} /></button>
        </div>
        <p className="text-xs">
          Tap ikon <strong>Bagikan</strong> (□↑) di Safari, lalu pilih{" "}
          <strong>"Tambah ke Layar Utama"</strong>.
        </p>
      </div>
    );
  }

  return null;
}
