import { db } from "@/lib/db";
import { notes, kanbanBoards, checklists } from "@/lib/db/schema";
import { folderRepository } from "@/features/folders/repositories/folder.repository";
import type { CreateFolderInput, UpdateFolderInput } from "@/features/folders/schemas/folder.schema";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { Folder } from "@/lib/db/schema";
import type {
  FolderWithCounts,
  FolderTreeNode,
  FolderWithPath,
  FolderBreadcrumbItem,
} from "@/features/folders/types/folder.types";

export type { FolderWithCounts, FolderTreeNode, FolderWithPath, FolderBreadcrumbItem };

export const folderService = {
  async getAll(): Promise<Folder[]> {
    return folderRepository.findAll();
  },

  async getFoldersWithCounts(): Promise<FolderWithCounts[]> {
    const [allFolders, allNotes, allBoards, allChecklists] = await Promise.all([
      folderRepository.findAll(),
      db.select({ folderId: notes.folderId }).from(notes),
      db.select({ folderId: kanbanBoards.folderId }).from(kanbanBoards),
      db.select({ folderId: checklists.folderId }).from(checklists),
    ]);

    const noteCounts = new Map<string, number>();
    for (const n of allNotes) {
      if (n.folderId) noteCounts.set(n.folderId, (noteCounts.get(n.folderId) ?? 0) + 1);
    }

    const boardCounts = new Map<string, number>();
    for (const b of allBoards) {
      if (b.folderId) boardCounts.set(b.folderId, (boardCounts.get(b.folderId) ?? 0) + 1);
    }

    const checklistCounts = new Map<string, number>();
    for (const c of allChecklists) {
      if (c.folderId) checklistCounts.set(c.folderId, (checklistCounts.get(c.folderId) ?? 0) + 1);
    }

    const subfolderCounts = new Map<string, number>();
    for (const f of allFolders) {
      if (f.parentId) {
        subfolderCounts.set(f.parentId, (subfolderCounts.get(f.parentId) ?? 0) + 1);
      }
    }

    return allFolders.map((f) => ({
      ...f,
      notesCount: noteCounts.get(f.id) ?? 0,
      boardsCount: boardCounts.get(f.id) ?? 0,
      checklistsCount: checklistCounts.get(f.id) ?? 0,
      subfoldersCount: subfolderCounts.get(f.id) ?? 0,
    }));
  },

  /**
   * Mengambil rantai breadcrumbs dari folder akar (root) hingga folder saat ini.
   */
  getFolderPath(folderId: string, allFolders: Folder[]): FolderBreadcrumbItem[] {
    const folderMap = new Map<string, Folder>(allFolders.map((f) => [f.id, f]));
    const path: FolderBreadcrumbItem[] = [];
    const visited = new Set<string>();

    let currentId: string | null | undefined = folderId;
    while (currentId && folderMap.has(currentId) && !visited.has(currentId)) {
      visited.add(currentId);
      const currentFolder: Folder | undefined = folderMap.get(currentId);
      if (!currentFolder) break;

      path.unshift({
        id: currentFolder.id,
        name: currentFolder.name,
        color: currentFolder.color,
      });
      currentId = currentFolder.parentId;
    }

    return path;
  },

  /**
   * Mengambil semua ID subfolder turunan (descendants) dari suatu folder.
   */
  getDescendantFolderIds(folderId: string, allFolders: Folder[]): string[] {
    const childrenMap = new Map<string, string[]>();
    for (const f of allFolders) {
      if (f.parentId) {
        const list = childrenMap.get(f.parentId) ?? [];
        list.push(f.id);
        childrenMap.set(f.parentId, list);
      }
    }

    const result: string[] = [];
    const queue = [...(childrenMap.get(folderId) ?? [])];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current)) {
        visited.add(current);
        result.push(current);
        const children = childrenMap.get(current) ?? [];
        queue.push(...children);
      }
    }

    return result;
  },

  /**
   * Mengonversi daftar folder menjadi pohon hierarki bertingkat (Tree Node).
   */
  buildFolderTree(foldersWithCounts: FolderWithCounts[]): FolderTreeNode[] {
    const nodeMap = new Map<string, FolderTreeNode>();
    for (const f of foldersWithCounts) {
      nodeMap.set(f.id, {
        ...f,
        children: [],
        depth: 0,
        path: f.name,
      });
    }

    const roots: FolderTreeNode[] = [];

    for (const f of foldersWithCounts) {
      const node = nodeMap.get(f.id)!;
      if (f.parentId && nodeMap.has(f.parentId)) {
        const parentNode = nodeMap.get(f.parentId)!;
        node.depth = parentNode.depth + 1;
        node.path = `${parentNode.path} / ${node.name}`;
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }

    // Rekursif perbaiki depth & path untuk turunan jika urutan array acak
    const updateDepths = (nodes: FolderTreeNode[], currentDepth: number, parentPath: string) => {
      for (const n of nodes) {
        n.depth = currentDepth;
        n.path = parentPath ? `${parentPath} / ${n.name}` : n.name;
        if (n.children.length > 0) {
          updateDepths(n.children, currentDepth + 1, n.path);
        }
      }
    };
    updateDepths(roots, 0, "");

    return roots;
  },

  /**
   * Mengembalikan daftar flat yang terurut secara hierarkis (pre-order traversal)
   * dengan indentasi visual untuk komponen dropdown / select.
   */
  getFolderHierarchy(folders: Folder[]): FolderWithPath[] {
    const childrenMap = new Map<string, Folder[]>();
    const roots: Folder[] = [];

    for (const f of folders) {
      if (f.parentId) {
        const list = childrenMap.get(f.parentId) ?? [];
        list.push(f);
        childrenMap.set(f.parentId, list);
      } else {
        roots.push(f);
      }
    }

    const result: FolderWithPath[] = [];

    const traverse = (node: Folder, depth: number, parentPath: string) => {
      const currentPath = parentPath ? `${parentPath} / ${node.name}` : node.name;
      const indentPrefix = depth === 0 ? "" : "  ".repeat(depth - 1) + "└─ ";
      result.push({
        ...node,
        depth,
        path: currentPath,
        indentLabel: `${indentPrefix}📁 ${node.name}`,
      });

      const children = childrenMap.get(node.id) ?? [];
      for (const child of children) {
        traverse(child, depth + 1, currentPath);
      }
    };

    for (const root of roots) {
      traverse(root, 0, "");
    }

    // Jika ada orphan nodes (parentId tidak valid), masukkan di akhir
    const processedIds = new Set(result.map((r) => r.id));
    for (const f of folders) {
      if (!processedIds.has(f.id)) {
        result.push({
          ...f,
          depth: 0,
          path: f.name,
          indentLabel: `📁 ${f.name}`,
        });
      }
    }

    return result;
  },

  async create(input: CreateFolderInput): Promise<Folder> {
    if (input.parentId) {
      const parent = await folderRepository.findById(input.parentId);
      if (!parent) throw new NotFoundError("Folder induk tidak ditemukan.");
    }
    return folderRepository.create(input);
  },

  async update(id: string, input: UpdateFolderInput): Promise<Folder> {
    const existing = await folderRepository.findById(id);
    if (!existing) throw new NotFoundError("Folder tidak ditemukan.");

    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        throw new ValidationError("Folder tidak dapat menjadi folder induk untuk dirinya sendiri.");
      }

      const allFolders = await folderRepository.findAll();
      const descendants = folderService.getDescendantFolderIds(id, allFolders);
      if (descendants.includes(input.parentId)) {
        throw new ValidationError("Folder tidak dapat dipindahkan ke dalam subfoldernya sendiri.");
      }

      const parentFolder = await folderRepository.findById(input.parentId);
      if (!parentFolder) throw new NotFoundError("Folder induk tidak ditemukan.");
    }

    const updated = await folderRepository.update(id, input);
    return updated!;
  },

  async delete(id: string): Promise<void> {
    const existing = await folderRepository.findById(id);
    if (!existing) throw new NotFoundError("Folder tidak ditemukan.");
    await folderRepository.delete(id);
  },
};