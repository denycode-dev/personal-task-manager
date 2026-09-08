/**
 * Client-side Shiki highlighter utility for Next.js App Router.
 * Dynamically loads Shiki to prevent SSR overhead and bundle bloat.
 * Provides caching, auto-language resolution, line-number formatting, and dual-theme support.
 */

import { isMermaidSyntax } from "./mermaid-renderer";

export type ShikiThemeMode = "light" | "dark" | "sepia" | "auto";

export const SUPPORTED_LANGUAGES: Record<string, string> = {
  javascript: "JavaScript",
  js: "JavaScript",
  typescript: "TypeScript",
  ts: "TypeScript",
  jsx: "React JSX",
  tsx: "React TSX",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  markdown: "Markdown",
  md: "Markdown",
  python: "Python",
  py: "Python",
  bash: "Bash / Shell",
  sh: "Bash / Shell",
  shell: "Bash / Shell",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
  rust: "Rust",
  rs: "Rust",
  go: "Go",
  golang: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  cs: "C#",
  php: "PHP",
  ruby: "Ruby",
  rb: "Ruby",
  diff: "Diff",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  graphql: "GraphQL",
  mermaid: "Mermaid Diagram",
  text: "Plain Text",
  txt: "Plain Text",
};

// Map short aliases to Shiki's recognized language IDs
const LANG_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  yml: "yaml",
  rs: "rust",
  golang: "go",
  cs: "csharp",
  rb: "ruby",
  docker: "dockerfile",
  txt: "text",
  plaintext: "text",
};

const SHIKI_THEMES = {
  light: "github-light",
  dark: "github-dark",
  sepia: "solarized-light",
} as const;

// In-memory cache to avoid re-highlighting identical code
const highlightCache = new Map<string, string>();
const MAX_CACHE_SIZE = 500;

type HighlighterInstance = Awaited<ReturnType<typeof import("shiki")["createHighlighter"]>>;
let highlighterInstancePromise: Promise<HighlighterInstance> | null = null;

/**
 * Initializes or returns the singleton Shiki highlighter instance.
 */
async function getHighlighter() {
  if (typeof window === "undefined") {
    throw new Error("Shiki highlighter can only run on the client side.");
  }

  if (!highlighterInstancePromise) {
    highlighterInstancePromise = (async () => {
      const { createHighlighter } = await import("shiki");
      return await createHighlighter({
        themes: [SHIKI_THEMES.light, SHIKI_THEMES.dark, SHIKI_THEMES.sepia],
        langs: [
          "javascript",
          "typescript",
          "jsx",
          "tsx",
          "html",
          "css",
          "json",
          "markdown",
          "python",
          "bash",
          "sql",
          "yaml",
          "rust",
          "go",
          "java",
          "c",
          "cpp",
          "csharp",
          "php",
          "ruby",
          "diff",
          "dockerfile",
          "graphql",
          "text",
        ],
      });
    })();
  }

  return highlighterInstancePromise;
}

/**
 * Detects if a code snippet uses Golang syntax.
 */
export function isGolangSyntax(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  return (
    /\bpackage\s+[a-zA-Z0-9_]+/.test(trimmed) ||
    /\bfunc\s+[a-zA-Z0-9_]+\s*\(/.test(trimmed) ||
    /\bfunc\s*\([^)]*\)\s*[a-zA-Z0-9_]+/.test(trimmed) ||
    /:=/.test(trimmed) ||
    /\bfmt\.(Print|Sprint|Errorf)/.test(trimmed) ||
    /\btype\s+[a-zA-Z0-9_]+\s+struct\b/.test(trimmed) ||
    /\btype\s+[a-zA-Z0-9_]+\s+interface\b/.test(trimmed)
  );
}

/**
 * Detects if a code snippet uses SQL syntax.
 */
export function isSqlSyntax(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  return (
    /\b(SELECT\s+[\s\S]+?\s+FROM|INSERT\s+INTO\s+[a-zA-Z0-9_]+|UPDATE\s+[a-zA-Z0-9_]+\s+SET|DELETE\s+FROM\s+[a-zA-Z0-9_]+|CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE)\b/i.test(trimmed) ||
    /^(BEGIN;|COMMIT;|CREATE\s+INDEX|DROP\s+INDEX)/im.test(trimmed)
  );
}

/**
 * Detects if a code snippet is valid JSON.
 */
export function isJsonSyntax(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Normalizes user-entered language name to a supported Shiki language.
 * If language is not specified or undetected, attempts smart detection
 * (mermaid diagrams, plain text for ASCII trees/schemas, SQL, Go, JSON) or defaults to 'javascript'.
 */
export function normalizeLanguage(
  lang: string | null | undefined,
  codeContent?: string
): string {
  if (typeof lang === "string" && lang.trim() !== "") {
    const clean = lang.trim().toLowerCase();
    if (clean === "mermaid") return "mermaid";
    if (clean === "golang") return "go";
    if (clean === "text" || clean === "plaintext" || clean === "txt") return "text";
    if (LANG_MAP[clean]) return LANG_MAP[clean];
    if (SUPPORTED_LANGUAGES[clean]) return clean;
  }

  // If no language was explicitly specified (or empty), attempt smart detection from content
  if (codeContent && typeof codeContent === "string") {
    const trimmed = codeContent.trim();
    // 1. Check for Mermaid diagrams first (before SQL / text)
    if (isMermaidSyntax(trimmed)) {
      return "mermaid";
    }
    // 2. Check for ASCII schema / tree diagrams / box drawing characters
    if (/[├└│─┌┐┘┴┬┼║═╚╝╔╗]/.test(trimmed)) {
      return "text";
    }
    // 3. Check for SQL syntax
    if (isSqlSyntax(trimmed)) {
      return "sql";
    }
    // 4. Check for Golang syntax
    if (isGolangSyntax(trimmed)) {
      return "go";
    }
    // 5. Check for JSON syntax
    if (isJsonSyntax(trimmed)) {
      return "json";
    }
  }

  return "javascript";
}

/**
 * Highlights a code snippet using Shiki according to the active theme.
 */
export async function highlightCodeWithShiki(
  code: string,
  rawLang: string,
  themeMode: "light" | "dark" | "sepia" = "dark",
  showLineNumbers = true
): Promise<{ html: string; error?: string }> {
  const trimmed = code ?? "";
  if (!trimmed) {
    return { html: "" };
  }

  const lang = normalizeLanguage(rawLang, trimmed);
  const effectiveLang = lang === "mermaid" ? "markdown" : lang;
  const themeName = SHIKI_THEMES[themeMode] || SHIKI_THEMES.dark;

  const cacheKey = `${themeMode}:${showLineNumbers ? "1" : "0"}:${effectiveLang}:${trimmed}`;
  if (highlightCache.has(cacheKey)) {
    return { html: highlightCache.get(cacheKey)! };
  }

  try {
    const highlighter = await getHighlighter();

    // Check if language needs to be loaded dynamically
    const loadedLangs = highlighter.getLoadedLanguages();
    if (!loadedLangs.includes(effectiveLang) && effectiveLang !== "text") {
      const { bundledLanguages } = await import("shiki");
      if (effectiveLang in bundledLanguages) {
        try {
          await highlighter.loadLanguage(effectiveLang as Parameters<typeof highlighter.loadLanguage>[0]);
        } catch {
          // Fall back to plain text if unknown
        }
      }
    }

    const actualLang = highlighter.getLoadedLanguages().includes(effectiveLang)
      ? effectiveLang
      : "text";

    const html = highlighter.codeToHtml(trimmed, {
      lang: actualLang,
      theme: themeName,
      transformers: [
        {
          line(node: { properties: Record<string, unknown> }, line: number) {
            if (showLineNumbers) {
              node.properties["data-line"] = line;
            }
          },
        },
      ],
    });

    // Cache the result
    if (highlightCache.size > MAX_CACHE_SIZE) {
      highlightCache.clear();
    }
    highlightCache.set(cacheKey, html);

    return { html };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      html: "",
      error: msg,
    };
  }
}
