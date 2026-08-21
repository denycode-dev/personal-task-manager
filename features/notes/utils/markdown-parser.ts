import JSZip from "jszip";

export interface ParsedMarkdownNote {
  title: string;
  content: TiptapDoc;
  rawMarkdown: string;
  snippet: string;
  folderName?: string;
  frontmatter?: Record<string, string>;
}

export interface TiptapNode {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface TiptapDoc {
  type: "doc";
  content: TiptapNode[];
}

/**
 * Slugify text for safe file names.
 */
export function slugifyFilename(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "catatan"
  );
}

/**
 * Parses inline formatting (bold, italic, strike, inline code, links, underline, images).
 */
function parseInlineMarkdown(text: string): TiptapNode[] {
  if (!text) return [];

  const nodes: TiptapNode[] = [];

  // Match inline tokens: image, link, code, bold/italic, underline, strike
  const tokenRegex =
    /(!?\[([^\]]*)\]\(([^)]+)\))|(`([^`]+)`)|(<b>([\s\S]*?)<\/b>|<strong>([\s\S]*?)<\/strong>|\*\*([^*]+)\*\*|__([^_]+)__)|(<i>([\s\S]*?)<\/i>|<em>([\s\S]*?)<\/em>|\*([^*]+)\*|_([^_]+)_)|(~~([^~]+)~~)|(<u>([\s\S]*?)<\/u>)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;

    // Plain text before token
    if (matchIndex > lastIndex) {
      nodes.push({
        type: "text",
        text: text.substring(lastIndex, matchIndex),
      });
    }

    const fullMatch = match[0];

    if (fullMatch.startsWith("![") && match[3]) {
      // Image: ![alt](url)
      nodes.push({
        type: "image",
        attrs: {
          src: match[3].trim(),
          alt: match[2]?.trim() || "",
        },
      });
    } else if (fullMatch.startsWith("[") && match[3]) {
      // Link: [text](url)
      const linkText = match[2] || match[3];
      nodes.push({
        type: "text",
        text: linkText,
        marks: [{ type: "link", attrs: { href: match[3].trim(), target: "_blank" } }],
      });
    } else if (fullMatch.startsWith("`") && match[5]) {
      // Inline Code: `code`
      nodes.push({
        type: "text",
        text: match[5],
        marks: [{ type: "code" }],
      });
    } else if (match[7] || match[8] || match[9] || match[10]) {
      // Bold: **text** or <b>text</b>
      const boldText = match[7] || match[8] || match[9] || match[10];
      nodes.push({
        type: "text",
        text: boldText,
        marks: [{ type: "bold" }],
      });
    } else if (match[12] || match[13] || match[14] || match[15]) {
      // Italic: *text* or <i>text</i>
      const italicText = match[12] || match[13] || match[14] || match[15];
      nodes.push({
        type: "text",
        text: italicText,
        marks: [{ type: "italic" }],
      });
    } else if (match[17]) {
      // Strike: ~~text~~
      nodes.push({
        type: "text",
        text: match[17],
        marks: [{ type: "strike" }],
      });
    } else if (match[19]) {
      // Underline: <u>text</u>
      nodes.push({
        type: "text",
        text: match[19],
        marks: [{ type: "underline" }],
      });
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    nodes.push({
      type: "text",
      text: text.substring(lastIndex),
    });
  }

  return nodes.length > 0 ? nodes : [{ type: "text", text }];
}

/**
 * Extracts YAML Frontmatter from a markdown string.
 */
function extractFrontmatter(markdown: string): {
  frontmatter: Record<string, string>;
  contentBody: string;
} {
  const frontmatter: Record<string, string> = {};
  const trimmed = markdown.trimStart();

  if (!trimmed.startsWith("---")) {
    return { frontmatter, contentBody: markdown };
  }

  const endIdx = trimmed.indexOf("\n---", 3);
  if (endIdx === -1) {
    return { frontmatter, contentBody: markdown };
  }

  const rawYaml = trimmed.substring(3, endIdx).trim();
  const contentBody = trimmed.substring(endIdx + 4).trimStart();

  const lines = rawYaml.split("\n");
  for (const line of lines) {
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.substring(0, colonIdx).trim();
      let value = line.substring(colonIdx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      frontmatter[key] = value;
    }
  }

  return { frontmatter, contentBody };
}

/**
 * Converts a Markdown string into a complete Tiptap JSON document.
 */
export function parseMarkdownToTiptap(
  rawMarkdown: string,
  fallbackTitle?: string
): ParsedMarkdownNote {
  const { frontmatter, contentBody } = extractFrontmatter(rawMarkdown);

  const lines = contentBody.split("\n");
  const tiptapNodes: TiptapNode[] = [];
  let extractedTitle = frontmatter.title || "";
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeBlockLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  const flushTable = () => {
    if (!inTable || tableLines.length === 0) return;
    const rows: TiptapNode[] = [];

    const parsedRows = tableLines.map((l) =>
      l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );

    // Skip divider row (e.g., |---|---|)
    const validRows = parsedRows.filter((cols) => !cols.every((c) => /^[-:\s]+$/.test(c)));

    validRows.forEach((cols, rowIndex) => {
      const isHeader = rowIndex === 0;
      const cellNodes: TiptapNode[] = cols.map((colText) => ({
        type: isHeader ? "tableHeader" : "tableCell",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarkdown(colText),
          },
        ],
      }));
      rows.push({
        type: "tableRow",
        content: cellNodes,
      });
    });

    if (rows.length > 0) {
      tiptapNodes.push({
        type: "table",
        content: rows,
      });
    }

    inTable = false;
    tableLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trimEnd();

    // 1. Code Block Fence
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        tiptapNodes.push({
          type: "codeBlock",
          attrs: { language: codeBlockLang || null },
          content: [
            {
              type: "text",
              text: codeBlockLines.join("\n"),
            },
          ],
        });
        inCodeBlock = false;
        codeBlockLang = "";
        codeBlockLines = [];
      } else {
        flushTable();
        inCodeBlock = true;
        codeBlockLang = line.trimStart().replace(/^```/, "").trim();
        codeBlockLines = [];
      }
      i++;
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      i++;
      continue;
    }

    // 2. Table detection
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      tableLines.push(line);
      i++;
      continue;
    } else if (inTable) {
      flushTable();
    }

    const trimmed = line.trim();

    // 3. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      tiptapNodes.push({ type: "horizontalRule" });
      i++;
      continue;
    }

    // 5. Headings (# H1 to ###### H6)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2].trim();

      // If no title was found yet, and this is an H1 at the start, use as note title
      if (!extractedTitle && level === 1 && tiptapNodes.length === 0) {
        extractedTitle = text;
      }

      tiptapNodes.push({
        type: "heading",
        attrs: { level },
        content: parseInlineMarkdown(text),
      });
      i++;
      continue;
    }

    // 6. Blockquotes
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      const quoteContent = quoteLines.join("\n");
      tiptapNodes.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: parseInlineMarkdown(quoteContent),
          },
        ],
      });
      continue;
    }

    // 7. Bullet Lists (- or *)
    if (/^[-*+]\s+/.test(trimmed)) {
      const listItems: TiptapNode[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*+]\s+/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineMarkdown(itemText),
            },
          ],
        });
        i++;
      }
      tiptapNodes.push({
        type: "bulletList",
        content: listItems,
      });
      continue;
    }

    // 8. Ordered Lists (1. 2. etc)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: TiptapNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, "");
        listItems.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: parseInlineMarkdown(itemText),
            },
          ],
        });
        i++;
      }
      tiptapNodes.push({
        type: "orderedList",
        attrs: { start: 1 },
        content: listItems,
      });
      continue;
    }

    // 9. Standard Paragraph
    tiptapNodes.push({
      type: "paragraph",
      content: parseInlineMarkdown(trimmed),
    });
    i++;
  }

  flushTable();

  // If title is still empty, fallback
  const finalTitle = (extractedTitle || fallbackTitle || "Catatan tanpa judul").trim();

  // Generate a plain text snippet from first few nodes
  let snippet = "";
  for (const node of tiptapNodes) {
    if (node.type === "paragraph" || node.type === "heading") {
      const text = (node.content || []).map((c) => c.text || "").join(" ");
      if (text) {
        snippet = text.slice(0, 160);
        break;
      }
    }
  }

  const doc: TiptapDoc = {
    type: "doc",
    content: tiptapNodes.length > 0 ? tiptapNodes : [{ type: "paragraph" }],
  };

  return {
    title: finalTitle,
    content: doc,
    rawMarkdown,
    snippet,
    folderName: frontmatter.folder,
    frontmatter,
  };
}

/**
 * Renders Tiptap node to markdown recursively.
 */
function renderTiptapToMarkdown(node: TiptapNode, listDepth = 0): string {
  if (!node) return "";

  if (node.type === "text") {
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

  const childrenText = (node.content || [])
    .map((child) => renderTiptapToMarkdown(child, listDepth))
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
            .map((c) => renderTiptapToMarkdown(c, listDepth + 1).trim())
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
            .map((c) => renderTiptapToMarkdown(c, listDepth + 1).trim())
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

    case "table": {
      const rows = node.content || [];
      if (rows.length === 0) return "";

      const tableLines: string[] = [];
      let isFirstRow = true;

      for (const row of rows) {
        const cells = row.content || [];
        const cellTexts = cells.map((cell) =>
          (cell.content || [])
            .map((c) => renderTiptapToMarkdown(c).trim())
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
 * Converts a note into a full formatted Markdown string with optional YAML frontmatter.
 */
export function convertNoteToMarkdown(
  title: string,
  content: unknown,
  options?: {
    includeFrontmatter?: boolean;
    folderName?: string;
    updatedAt?: Date;
    createdAt?: Date;
  }
): string {
  let bodyMarkdown = "";

  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content) as TiptapNode;
      bodyMarkdown = renderTiptapToMarkdown(parsed);
    } catch {
      bodyMarkdown = content;
    }
  } else if (content && typeof content === "object") {
    bodyMarkdown = renderTiptapToMarkdown(content as TiptapNode);
  }

  const cleanTitle = (title || "Catatan tanpa judul").trim();
  const dateStr = options?.updatedAt
    ? new Date(options.updatedAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  let header = "";
  if (options?.includeFrontmatter) {
    header = `---\ntitle: "${cleanTitle.replace(/"/g, '\\"')}"\ndate: ${dateStr}\n${
      options.folderName ? `folder: "${options.folderName}"\n` : ""
    }---\n\n`;
  } else {
    header = `# ${cleanTitle}\n\n> 📅 Terakhir diperbarui: ${
      options?.updatedAt
        ? new Date(options.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : new Date().toLocaleDateString("id-ID")
    }\n\n---\n\n`;
  }

  return `${header}${bodyMarkdown.trim()}\n`;
}

/**
 * Initiates single markdown file download in the browser.
 */
export function downloadSingleMarkdownNote(
  title: string,
  content: unknown,
  options?: {
    folderName?: string;
    updatedAt?: Date;
    includeFrontmatter?: boolean;
  }
): void {
  const mdString = convertNoteToMarkdown(title, content, options);
  const blob = new Blob([mdString], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const sanitizedFilename = slugifyFilename(title) || "catatan";
  link.href = url;
  link.download = `${sanitizedFilename}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Packages multiple notes into a ZIP archive and triggers browser download.
 */
export async function downloadNotesZip(
  notesList: Array<{
    title: string;
    content: unknown;
    folderName?: string;
    updatedAt?: Date;
  }>,
  options?: {
    zipFilename?: string;
    includeFrontmatter?: boolean;
  }
): Promise<void> {
  const zip = new JSZip();
  const filenameCounter: Record<string, number> = {};

  for (const note of notesList) {
    const mdContent = convertNoteToMarkdown(note.title, note.content, {
      folderName: note.folderName,
      updatedAt: note.updatedAt,
      includeFrontmatter: options?.includeFrontmatter ?? true,
    });

    const folderPrefix = note.folderName ? `${slugifyFilename(note.folderName)}/` : "";
    const baseSlug = slugifyFilename(note.title);
    const key = `${folderPrefix}${baseSlug}`;

    const count = filenameCounter[key] || 0;
    filenameCounter[key] = count + 1;

    const fileSuffix = count === 0 ? "" : ` (${count})`;
    const filePath = `${folderPrefix}${baseSlug}${fileSuffix}.md`;

    zip.file(filePath, mdContent);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nowStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = options?.zipFilename || `catatan-export-${nowStr}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Combines multiple notes into a single Markdown master document with Table of Contents.
 */
export function downloadCombinedMarkdown(
  notesList: Array<{
    title: string;
    content: unknown;
    folderName?: string;
    updatedAt?: Date;
  }>,
  customFilename?: string
): void {
  const lines: string[] = [
    `# 📚 Ekspor Catatan Denycode`,
    `> Diekspor pada: ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    `> Total Catatan: ${notesList.length}`,
    `\n## 📑 Daftar Isi\n`,
  ];

  notesList.forEach((n, idx) => {
    const folderTag = n.folderName ? ` [${n.folderName}]` : "";
    lines.push(`${idx + 1}. [${n.title || "Catatan"}](#${slugifyFilename(n.title)})${folderTag}`);
  });

  lines.push("\n---\n");

  notesList.forEach((n, idx) => {
    const folderTag = n.folderName ? ` *(${n.folderName})*` : "";
    lines.push(`\n<a id="${slugifyFilename(n.title)}"></a>`);
    lines.push(`\n## ${idx + 1}. ${n.title || "Catatan"}${folderTag}\n`);

    let body = "";
    if (typeof n.content === "string") {
      try {
        body = renderTiptapToMarkdown(JSON.parse(n.content));
      } catch {
        body = n.content;
      }
    } else if (n.content && typeof n.content === "object") {
      body = renderTiptapToMarkdown(n.content as TiptapNode);
    }

    lines.push(body.trim());
    lines.push("\n\n---\n");
  });

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nowStr = new Date().toISOString().split("T")[0];
  link.href = url;
  link.download = customFilename || `koleksi-catatan-${nowStr}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Extracts all .md and .txt files from a ZIP archive.
 */
export async function extractMarkdownFilesFromZip(
  zipFile: File
): Promise<ParsedMarkdownNote[]> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(zipFile);
  const parsedNotes: ParsedMarkdownNote[] = [];

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (
      !zipEntry.dir &&
      (relativePath.endsWith(".md") ||
        relativePath.endsWith(".markdown") ||
        relativePath.endsWith(".txt")) &&
      !relativePath.startsWith("__MACOSX/")
    ) {
      filePromises.push(
        zipEntry.async("string").then((content) => {
          // Detect potential folder name from relative path (e.g., "Work/project.md" -> folder "Work")
          const pathParts = relativePath.split("/");
          let detectedFolder = "";
          if (pathParts.length > 1) {
            detectedFolder = pathParts[0];
          }

          const filename = pathParts[pathParts.length - 1].replace(/\.(md|markdown|txt)$/i, "");
          const parsed = parseMarkdownToTiptap(content, filename);
          if (!parsed.folderName && detectedFolder) {
            parsed.folderName = detectedFolder;
          }
          parsedNotes.push(parsed);
        })
      );
    }
  });

  await Promise.all(filePromises);
  return parsedNotes;
}
