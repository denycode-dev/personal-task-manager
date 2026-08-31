import type { Folder } from "@/lib/db/schema";

export interface FolderWithCounts extends Folder {
  notesCount: number;
  boardsCount: number;
  checklistsCount: number;
  subfoldersCount: number;
}

export interface FolderTreeNode extends FolderWithCounts {
  children: FolderTreeNode[];
  depth: number;
  path: string;
}

export interface FolderWithPath extends Folder {
  depth: number;
  path: string;
  indentLabel: string;
}

export interface FolderBreadcrumbItem {
  id: string;
  name: string;
  color: string;
}
