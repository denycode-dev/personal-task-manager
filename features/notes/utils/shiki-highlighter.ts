/**
 * Client-side Shiki highlighter utility for Next.js App Router.
 * Dynamically loads Shiki to prevent SSR overhead and bundle bloat.
 * Provides caching, auto-language resolution, line-number formatting, and dual-theme support.
 */

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
 * Normalizes user-entered language name to a supported Shiki language.
 */
export function normalizeLanguage(lang: string | null | undefined): string {
  if (!lang || typeof lang !== "string") return "text";
  const clean = lang.trim().toLowerCase();
  if (clean === "mermaid") return "mermaid";
  if (LANG_MAP[clean]) return LANG_MAP[clean];
  if (SUPPORTED_LANGUAGES[clean]) return clean;
  return "text";
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

  const lang = normalizeLanguage(rawLang);
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
