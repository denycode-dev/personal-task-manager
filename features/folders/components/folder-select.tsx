"use client";
import { useEffect, useState } from "react";
import type { Folder } from "@/lib/db/schema";

type Props = {
  value: string;
  onChange: (id: string) => void;
  folders: Folder[];
};

export function FolderSelect({ value, onChange, folders }: Props) {
  return (
    <select suppressHydrationWarning       value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-2 border-black px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
      <option value="">— Tanpa folder —</option>
      {folders.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
