import { useConfirmStore } from "@/lib/stores/confirm.store";

export function useConfirm() {
  return useConfirmStore((s) => s.ask);
}
