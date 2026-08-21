"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/cache/query-client";
import { Toaster } from "@/components/ui/sonner";
import { ConnectionStatus } from "@/components/pwa/connection-status";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRef } from "react";
import { ImageKitProvider } from "@imagekit/next";

interface ProvidersProps {
  children: React.ReactNode;
  imagekitUrlEndpoint?: string;
}

export function Providers({ children, imagekitUrlEndpoint = "" }: ProvidersProps) {
  const clientRef = useRef(getQueryClient());
  const urlEndpoint = imagekitUrlEndpoint || process.env.IMAGEKIT_URL_ENDPOINT || "";

  return (
    <QueryClientProvider client={clientRef.current}>
      <ImageKitProvider urlEndpoint={urlEndpoint}>
        {children}
      </ImageKitProvider>
      <Toaster position="bottom-right" richColors />
      <ConnectionStatus />
      <InstallPrompt />
      <ConfirmDialog />
    </QueryClientProvider>
  );
}
