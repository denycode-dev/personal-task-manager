import { searchRepository } from "@/features/search/repositories/search.repository";
import type { SearchResultItem } from "@/features/search/types";

export const searchService = {
  async search(query: string): Promise<SearchResultItem[]> {
    if (!query.trim()) return [];

    const { foundNotes, foundBoards, foundChecklists, foundFolders } =
      await searchRepository.search(query);

    const results: SearchResultItem[] = [
      ...foundNotes.map((n) => ({
        id: n.id,
        type: "note" as const,
        title: n.title,
        url: `/notes/${n.id}`,
      })),
      ...foundBoards.map((b) => ({
        id: b.id,
        type: "board" as const,
        title: b.title,
        url: `/kanban/${b.id}`,
      })),
      ...foundChecklists.map((c) => ({
        id: c.id,
        type: "checklist" as const,
        title: c.title,
        url: `/checklists/${c.id}`,
      })),
      ...foundFolders.map((f) => ({
        id: f.id,
        type: "folder" as const,
        title: f.name,
        url: `/folders`,
      })),
    ];

    return results;
  },
};