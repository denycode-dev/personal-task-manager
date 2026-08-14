"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlass,
  Note,
  Kanban,
  CheckSquare,
  Folder,
} from "@phosphor-icons/react";
import { globalSearchAction } from "@/features/search/actions/global-search.action";
import type { SearchResultItem } from "@/features/search/types";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleChange = (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const result = await globalSearchAction(value);
      if (result.success) {
        setResults(result.data);
        setOpen(true);
      }
    });
  };

  const renderTypeIcon = (type: SearchResultItem["type"]) => {
    switch (type) {
      case "note":
        return <Note size={16} weight="fill" className="text-yellow-600 shrink-0" />;
      case "board":
        return <Kanban size={16} weight="fill" className="text-blue-600 shrink-0" />;
      case "checklist":
        return <CheckSquare size={16} weight="fill" className="text-emerald-600 shrink-0" />;
      case "folder":
        return <Folder size={16} weight="fill" className="text-purple-600 shrink-0" />;
      default:
        return <Note size={16} weight="fill" className="text-neutral-500 shrink-0" />;
    }
  };

  return (
    <div className="relative w-full max-w-xs">
      <div className="relative">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          suppressHydrationWarning
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Cari catatan, kanban, checklist..."
          className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border-2 border-black focus:outline-none focus:bg-yellow-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 max-h-64 overflow-y-auto divide-y divide-black/10 animate-in fade-in zoom-in-95">
          {results.map((r) => (
            <li key={r.id}>
              <button
                suppressHydrationWarning
                type="button"
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold hover:bg-yellow-100 text-left transition-colors"
                onMouseDown={() => {
                  router.push(r.url);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {renderTypeIcon(r.type)}
                <span className="truncate text-black">{r.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !isPending && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-black p-3 text-xs text-muted-foreground z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          Tidak ada hasil untuk &quot;{query}&quot;.
        </div>
      )}
    </div>
  );
}
