export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface ReadingStats {
  words: number;
  readingTimeMinutes: number;
  characters: number;
  paragraphs: number;
}

export interface ReaderPreferences {
  fontSize: "sm" | "base" | "lg" | "xl";
  fontFamily: "sans" | "serif" | "mono";
  lineHeight: "normal" | "relaxed" | "loose";
  containerWidth: "standard" | "wide" | "full";
  theme: "light" | "sepia" | "dark";
  focusMode: boolean;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontSize: "base",
  fontFamily: "sans",
  lineHeight: "relaxed",
  containerWidth: "wide",
  theme: "light",
  focusMode: false,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Extracts plain text recursively from a Tiptap JSON document structure or raw string.
 */
export function extractPlainText(content: unknown): string {
  if (!content) return "";

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      return extractPlainText(parsed);
    } catch {
      // It's already raw text or HTML, strip HTML tags if present
      return content.replace(/<[^>]*>?/gm, "").trim();
    }
  }

  if (typeof content === "object" && content !== null) {
    const node = content as { type?: string; text?: string; content?: unknown[] };

    if (node.text) {
      return node.text;
    }

    if (Array.isArray(node.content)) {
      const textParts: string[] = [];
      for (const child of node.content) {
        const childText = extractPlainText(child);
        if (childText) {
          textParts.push(childText);
        }
      }

      if (node.type === "paragraph" || node.type?.startsWith("heading")) {
        return textParts.join("") + "\n\n";
      }

      if (node.type === "listItem") {
        return "• " + textParts.join("") + "\n";
      }

      return textParts.join(" ");
    }
  }

  return "";
}

/**
 * Calculates reading statistics (word count, reading time in minutes, character count).
 */
export function calculateReadingStats(content: unknown): ReadingStats {
  const plainText = extractPlainText(content).trim();
  if (!plainText) {
    return { words: 0, readingTimeMinutes: 0, characters: 0, paragraphs: 0 };
  }

  const words = plainText
    .split(/\s+/)
    .filter((w) => w.trim().length > 0).length;

  const characters = plainText.length;
  const paragraphs = plainText
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0).length;

  // Average reading speed: 200 words per minute (WPM)
  const readingTimeMinutes = words > 0 ? Math.max(1, Math.ceil(words / 200)) : 0;

  return {
    words,
    readingTimeMinutes,
    characters,
    paragraphs,
  };
}

/**
 * Extracts headings (H1, H2, H3) to build a Table of Contents.
 */
export function extractTableOfContents(content: unknown): TocItem[] {
  if (!content) return [];

  let jsonContent = content;
  if (typeof content === "string") {
    try {
      jsonContent = JSON.parse(content);
    } catch {
      return [];
    }
  }

  const items: TocItem[] = [];
  const headingCounts = new Map<string, number>();

  function traverse(node: unknown) {
    if (!node || typeof node !== "object") return;
    const itemNode = node as {
      type?: string;
      attrs?: { level?: number };
      content?: unknown[];
      text?: string;
    };

    if (itemNode.type === "heading") {
      const level = itemNode.attrs?.level || 1;
      const text = extractPlainText(itemNode).trim();

      if (text) {
        const baseSlug = slugify(text) || `heading-${items.length + 1}`;
        const count = headingCounts.get(baseSlug) || 0;
        headingCounts.set(baseSlug, count + 1);

        const id = count === 0 ? baseSlug : `${baseSlug}-${count}`;
        items.push({ id, text, level });
      }
    }

    if (Array.isArray(itemNode.content)) {
      for (const child of itemNode.content) {
        traverse(child);
      }
    }
  }

  traverse(jsonContent);
  return items;
}

interface MarkNode {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: MarkNode[];
}

function renderTextWithMarks(node: TiptapNode): string {
  let text = node.text || "";
  if (!node.marks || node.marks.length === 0) return text;

  for (const mark of node.marks) {
    switch (mark.type) {
      case "bold":
        text = `**${text}**`;
        break;
      case "italic":
        text = `*${text}*`;
        break;
      case "strike":
        text = `~~${text}~~`;
        break;
      case "code":
        text = `\`${text}\``;
        break;
      case "underline":
        text = `<u>${text}</u>`;
        break;
      case "link": {
        const href = mark.attrs?.href ? String(mark.attrs.href) : "#";
        text = `[${text}](${href})`;
        break;
      }
    }
  }
  return text;
}

function renderNodeToMarkdown(node: TiptapNode, listDepth = 0): string {
  if (!node) return "";

  if (node.type === "text") {
    return renderTextWithMarks(node);
  }

  const childrenText = (node.content || [])
    .map((child) => renderNodeToMarkdown(child, listDepth))
    .join("");

  switch (node.type) {
    case "doc":
      return childrenText;

    case "paragraph":
      return childrenText ? `${childrenText}\n\n` : "\n";

    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 1;
      const prefix = "#".repeat(Math.min(6, Math.max(1, level)));
      return `${prefix} ${childrenText.trim()}\n\n`;
    }

    case "bulletList": {
      const listItems = (node.content || [])
        .map((li) => {
          const itemText = (li.content || [])
            .map((c) => renderNodeToMarkdown(c, listDepth + 1).trim())
            .filter(Boolean)
            .join(" ");
          const indent = "  ".repeat(listDepth);
          return `${indent}- ${itemText}`;
        })
        .join("\n");
      return `${listItems}\n\n`;
    }

    case "orderedList": {
      const start = typeof node.attrs?.start === "number" ? node.attrs.start : 1;
      const listItems = (node.content || [])
        .map((li, idx) => {
          const itemText = (li.content || [])
            .map((c) => renderNodeToMarkdown(c, listDepth + 1).trim())
            .filter(Boolean)
            .join(" ");
          const indent = "  ".repeat(listDepth);
          return `${indent}${start + idx}. ${itemText}`;
        })
        .join("\n");
      return `${listItems}\n\n`;
    }

    case "blockquote": {
      const lines = childrenText.trim().split("\n");
      const quoted = lines.map((line) => `> ${line}`).join("\n");
      return `${quoted}\n\n`;
    }

    case "codeBlock": {
      const lang = node.attrs?.language ? String(node.attrs.language) : "";
      const code = (node.content || []).map((c) => c.text || "").join("");
      return `\`\`\`${lang}\n${code}\n\`\`\`\n\n`;
    }

    case "image": {
      const src = node.attrs?.src ? String(node.attrs.src) : "";
      const alt = node.attrs?.alt ? String(node.attrs.alt) : "";
      return `![${alt}](${src})\n\n`;
    }

    case "horizontalRule":
      return "---\n\n";

    case "hardBreak":
      return "  \n";

    case "table": {
      const rows = node.content || [];
      if (rows.length === 0) return "";

      const tableLines: string[] = [];
      let isFirstRow = true;

      for (const row of rows) {
        const cells = row.content || [];
        const cellTexts = cells.map((cell) =>
          (cell.content || [])
            .map((c) => renderNodeToMarkdown(c).trim())
            .join(" ")
            .replace(/\|/g, "\\|")
            .replace(/\n+/g, " ")
        );

        tableLines.push(`| ${cellTexts.join(" | ")} |`);

        if (isFirstRow) {
          const dividers = cells.map(() => "---");
          tableLines.push(`| ${dividers.join(" | ")} |`);
          isFirstRow = false;
        }
      }

      return `${tableLines.join("\n")}\n\n`;
    }

    default:
      return childrenText;
  }
}

/**
 * Converts a note title and Tiptap content into a full formatted Markdown string.
 */
export function convertToMarkdown(
  title: string,
  content: unknown,
  updatedAt?: Date
): string {
  let bodyMarkdown = "";

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as TiptapNode;
      bodyMarkdown = renderNodeToMarkdown(parsed);
    } catch {
      bodyMarkdown = content;
    }
  } else if (content && typeof content === "object") {
    bodyMarkdown = renderNodeToMarkdown(content as TiptapNode);
  }

  const cleanTitle = (title || "Catatan Tanpa Judul").trim();
  const dateStr = updatedAt
    ? new Date(updatedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("id-ID");

  const header = `# ${cleanTitle}\n\n> 📅 Terakhir diperbarui: ${dateStr}\n> 📝 Denycode Task Manager\n\n---\n\n`;

  return `${header}${bodyMarkdown.trim()}\n`;
}

/**
 * Initiates a browser download of the note as a .md file.
 */
export function downloadMarkdownFile(
  title: string,
  content: unknown,
  updatedAt?: Date
): void {
  const mdString = convertToMarkdown(title, content, updatedAt);
  const blob = new Blob([mdString], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const sanitizedFilename = slugify(title) || "catatan";
  link.href = url;
  link.download = `${sanitizedFilename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

