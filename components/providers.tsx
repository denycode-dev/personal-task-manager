"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/query-client";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionStatus } from "@/components/pwa/connection-status";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRef } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientRef = useRef(getQueryClient());
  return (
    <QueryClientProvider client={clientRef.current}>
      {children}
      <Toaster position="bottom-right" richColors />
      <ConnectionStatus />
      <InstallPrompt />
      <ConfirmDialog />
    </QueryClientProvider>
  );
}
