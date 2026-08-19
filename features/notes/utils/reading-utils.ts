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
