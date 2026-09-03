/**
 * Utilities for detecting and handling Markdown content from clipboard and user interactions.
 */

/**
 * Checks if a plain text string contains Markdown syntax patterns.
 * Designed to accurately identify Markdown while avoiding false positives on plain single-line text.
 */
export function isMarkdownContent(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;

  // 1. Headings: # H1, ## H2, ### H3, etc. at start of line
  if (/^#{1,6}\s+\S+/m.test(trimmed)) return true;

  // 2. Fenced code blocks or Mermaid blocks: ```lang or ```
  if (/^```[a-zA-Z0-9_-]*\s*$/m.test(trimmed)) return true;

  // 3. Blockquotes: > quote
  if (/^>\s+\S+/m.test(trimmed)) return true;

  // 4. Bullet lists, numbered lists: - item, * item, + item, 1. item
  if (/^(\s*[-*+]\s+|\s*\d+\.\s+)\S+/m.test(trimmed)) return true;

  // 5. Task list items: - [ ] or - [x]
  if (/^\s*[-*+]\s+\[[ xX]\]\s+\S+/m.test(trimmed)) return true;

  // 6. GFM Tables: header row followed by delimiter row |---|---|
  if (/\|[^\n]+\|\s*\n\s*\|(?:\s*:?-+:?\s*\|)+/m.test(trimmed)) return true;

  // 7. Horizontal rules: ---, ***, ___ on their own line
  if (/^(\*{3,}|-{3,}|_{3,})\s*$/m.test(trimmed)) return true;

  // 8. Markdown image syntax: ![alt](url)
  if (/!\[[^\]]*\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)/.test(trimmed)) return true;

  // 9. Markdown links syntax: [title](url)
  if (/\[[^\]]+\]\((?:https?:\/\/[^\s)]+|\/[^\s)]+)\)/.test(trimmed)) return true;

  // 10. Multi-line text with inline bold/italic/strike or inline code spans
  if (
    trimmed.includes("\n") &&
    (/(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|`[^`]+`)/.test(trimmed))
  ) {
    return true;
  }

  return false;
}

/**
 * Formats note title and Markdown body for clean clipboard copying.
 */
export function formatMarkdownForClipboard(title: string, markdownBody: string): string {
  const cleanTitle = title?.trim() || "Catatan Tanpa Judul";
  const cleanBody = markdownBody?.trim() || "";

  // If the body already starts with a level 1 heading matching the title, don't duplicate it
  if (cleanBody.startsWith(`# ${cleanTitle}`)) {
    return `${cleanBody}\n`;
  }

  if (!cleanBody) {
    return `# ${cleanTitle}\n`;
  }

  return `# ${cleanTitle}\n\n${cleanBody}\n`;
}
