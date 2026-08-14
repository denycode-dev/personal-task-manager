export type SearchResultItem = {
  id: string;
  type: "note" | "board" | "checklist" | "folder";
  title: string;
  excerpt?: string;
  url: string;
};