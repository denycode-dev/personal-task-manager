"use client";
import { useMemo } from "react";
import type { Folder } from "@/lib/db/schema";
import { folderService } from "@/features/folders/services/folder.service";

type Props = {
  value: string;
  onChange: (id: string) => void;
  folders: Folder[];
  disabledFolderIds?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function FolderSelect({
  value,
  onChange,
  folders,
  disabledFolderIds = [],
  placeholder = "— Tanpa folder —",
  disabled = false,
  className,
}: Props) {
  const hierarchicalFolders = useMemo(() => {
    return folderService.getFolderHierarchy(folders);
  }, [folders]);

  return (
    <select
      suppressHydrationWarning
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={
        className ??
        "w-full border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium disabled:opacity-60"
      }
    >
      <option value="">{placeholder}</option>
      {hierarchicalFolders.map((f) => {
        const isDisabled = disabledFolderIds.includes(f.id);
        return (
          <option
            key={f.id}
            value={f.id}
            disabled={isDisabled}
            className={isDisabled ? "text-neutral-400 italic" : "text-black"}
          >
            {f.indentLabel} {isDisabled ? "(Tidak dapat dipilih)" : ""}
          </option>
        );
      })}
    </select>
  );
}

