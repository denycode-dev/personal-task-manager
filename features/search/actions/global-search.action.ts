"use server";

import { requireAuth } from "@/lib/auth/session";
import { searchService } from "@/features/search/services/search.service";
import type { ActionResult } from "@/types/api";
import type { SearchResultItem } from "@/features/search/types";

export async function globalSearchAction(
  query: string
): Promise<ActionResult<SearchResultItem[]>> {
  await requireAuth();
  const results = await searchService.search(query);
  return { success: true, data: results };
}