/**
 * Client-side Mermaid utility for Next.js App Router.
 * Dynamically imports mermaid to prevent SSR issues and keep bundle size optimal.
 */

const MERMAID_KEYWORDS = [
  "graph",
  "flowchart",
  "sequencediagram",
  "classdiagram",
  "statediagram",
  "erdiagram",
  "gantt",
  "pie",
  "gitgraph",
  "mindmap",
  "journey",
  "timeline",
  "quadrantchart",
  "xychart",
  "zenuml",
  "sankey-beta",
  "packet-beta",
  "kanban",
  "block-beta",
  "architecture-beta",
  "requirementdiagram",
  "c4context",
  "c4container",
  "c4component",
  "c4dynamic",
  "c4deployment",
];

/**
 * Checks whether a given string is Mermaid diagram syntax.
 */
export function isMermaidSyntax(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim().toLowerCase();
  if (!trimmed) return false;

  // Check lines ignoring comments (%%)
  const lines = trimmed
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%"));

  if (lines.length === 0) return false;

  const firstLine = lines[0];
  return MERMAID_KEYWORDS.some((kw) => {
    return (
      firstLine === kw ||
      firstLine.startsWith(`${kw} `) ||
      firstLine.startsWith(`${kw}\t`) ||
      firstLine.startsWith(`${kw}\n`) ||
      firstLine.startsWith(`${kw}:`)
    );
  });
}

/**
 * Normalizes mermaid code by:
 * 1. Trimming extra blank lines and standardizing line breaks.
 * 2. Replacing non-breaking spaces and zero-width spaces that break lexers.
 * 3. Normalizing smart/curly quotes to standard ASCII quotes.
 * 4. Auto-quoting unquoted node labels with special characters (., &, /, (, ), etc.).
 * 5. Auto-quoting edge labels with arrows or parentheses like `<-`, `->`, `()`.
 */
export function cleanMermaidCode(rawCode: string): string {
  if (!rawCode) return "";

  const cleaned = rawCode
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g, " ")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"');

  // Split into lines to safely pre-process edge and node syntax
  const lines = cleaned.split("\n");
  const processedLines = lines.map((line) => {
    let l = line;

    // 1. Subgraph normalization:
    // e.g. subgraph Backend Daily Worker (23:00 WIB)
    const subgraphMatch = l.match(/^(\s*subgraph\s+)([^"\[\n]+)$/);
    if (subgraphMatch) {
      const prefix = subgraphMatch[1];
      const rawTitle = subgraphMatch[2].trim();
      if (/[()&/.:,;]/.test(rawTitle)) {
        return `${prefix}"${rawTitle}"`;
      }
    }

    // 2. Auto-quote edge labels: -- label --> or -. label .-> or == label ==>
    // e.g. I -- case <-time.After(waitDuration) --> J
    l = l.replace(
      /(\s--|\s\.-|\s==)\s+([^\s"][^\n\r]+?)\s+(-->|\.->|==>)/g,
      (match, start, label, end) => {
        const trimmedLabel = label.trim();
        if (
          !trimmedLabel.startsWith('"') &&
          /[<>()&/|]/.test(trimmedLabel)
        ) {
          return `${start} "${trimmedLabel}" ${end}`;
        }
        return match;
      }
    );

    // 3. Auto-quote pipe edge labels: -->|label| or -.->|label|
    // e.g. -->|case <-time.After(waitDuration)| or -->|Gap (Status Naik)|
    l = l.replace(
      /(-->|\.->|==>)\|([^"\n\r|]+?)\|/g,
      (match, arrow, label) => {
        const trimmedLabel = label.trim();
        if (
          !trimmedLabel.startsWith('"') &&
          /[<>()&/]/.test(trimmedLabel)
        ) {
          return `${arrow}|"${trimmedLabel}"|`;
        }
        return match;
      }
    );

    // 4. Auto-quote stadium node labels: ID([label])
    l = l.replace(
      /\b([a-zA-Z0-9_-]+)\(\[([^"\n\r\]]+?)\]\)/g,
      (match, nodeId, label) => {
        const trimmedLabel = label.trim();
        if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
          return match;
        }
        if (/[&/().,]/.test(trimmedLabel)) {
          return `${nodeId}(["${trimmedLabel}"])`;
        }
        return match;
      }
    );

    // 5. Auto-quote rhombus/decision node labels: ID{label}
    l = l.replace(
      /\b([a-zA-Z0-9_-]+)\{([^"\n\r\}]+?)\}/g,
      (match, nodeId, label) => {
        const trimmedLabel = label.trim();
        if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
          return match;
        }
        if (/[&/().,]/.test(trimmedLabel)) {
          return `${nodeId}{"${trimmedLabel}"}`;
        }
        return match;
      }
    );

    // 6. Auto-quote square bracket node labels: ID[label] where label is not quoted and has special chars
    // e.g. A[1. HR Tetapkan Keahlian Wajib Peran] or C[3. HR & Pimpinan Pantau di Dasbor / Daftar Talenta]
    l = l.replace(
      /\b([a-zA-Z0-9_-]+)\[([^"\n\r\]]+?)\]/g,
      (match, nodeId, label) => {
        const trimmedLabel = label.trim();
        if (trimmedLabel.startsWith('"') && trimmedLabel.endsWith('"')) {
          return match;
        }
        if (/[&/().,]/.test(trimmedLabel)) {
          return `${nodeId}["${trimmedLabel}"]`;
        }
        return match;
      }
    );

    return l;
  });

  return processedLines.join("\n").trim();
}

let currentConfiguredTheme: string | null = null;

/**
 * Safely loads and initializes mermaid singleton instance on the client with the specified theme.
 */
export async function getMermaidInstance(theme: "light" | "dark" | "sepia" = "light") {
  if (typeof window === "undefined") {
    return null;
  }

  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;

  if (currentConfiguredTheme !== theme) {
    const isDark = theme === "dark";
    const isSepia = theme === "sepia";

    const themeVariables = isDark
      ? {
          darkMode: true,
          background: "#09090b",
          primaryColor: "#ca8a04",
          primaryTextColor: "#fafafa",
          primaryBorderColor: "#a1a1aa",
          lineColor: "#f4f4f5",
          textColor: "#fafafa",
          secondaryColor: "#27272a",
          tertiaryColor: "#18181b",
          edgeLabelBackground: "#18181b",
          nodeBorder: "#a1a1aa",
          mainBkg: "#18181b",
          nodeTextColor: "#fafafa",
          clusterBkg: "#121215",
          clusterBorder: "#71717a",
          titleColor: "#fafafa",
          actorBorder: "#ca8a04",
          actorBkg: "#27272a",
          actorTextColor: "#fafafa",
          labelBoxBkgColor: "#18181b",
          labelBoxBorderColor: "#a1a1aa",
          labelTextColor: "#fafafa",
        }
      : isSepia
      ? {
          darkMode: false,
          background: "#fdf8ee",
          primaryColor: "#fde047",
          primaryTextColor: "#292524",
          primaryBorderColor: "#78350f",
          lineColor: "#451a03",
          textColor: "#292524",
          secondaryColor: "#f5ebd8",
          tertiaryColor: "#ebe0cb",
          edgeLabelBackground: "#f5ebd8",
          nodeBorder: "#78350f",
          mainBkg: "#fcf7ed",
          nodeTextColor: "#292524",
          clusterBkg: "#f7efe0",
          clusterBorder: "#92400e",
          titleColor: "#451a03",
          actorBorder: "#78350f",
          actorBkg: "#fde047",
          actorTextColor: "#292524",
          labelBoxBkgColor: "#fcf7ed",
          labelBoxBorderColor: "#78350f",
          labelTextColor: "#292524",
        }
      : {
          darkMode: false,
          background: "#ffffff",
          primaryColor: "#fef08a",
          primaryTextColor: "#171717",
          primaryBorderColor: "#000000",
          lineColor: "#000000",
          textColor: "#171717",
          secondaryColor: "#ffffff",
          tertiaryColor: "#f3f4f6",
          edgeLabelBackground: "#ffffff",
          nodeBorder: "#000000",
          mainBkg: "#ffffff",
          nodeTextColor: "#171717",
          clusterBkg: "#f9fafb",
          clusterBorder: "#000000",
          titleColor: "#000000",
          actorBorder: "#000000",
          actorBkg: "#fef08a",
          actorTextColor: "#171717",
          labelBoxBkgColor: "#ffffff",
          labelBoxBorderColor: "#000000",
          labelTextColor: "#171717",
        };

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      fontFamily:
        "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      theme: "base",
      themeVariables,
      themeCSS: `
        .cluster-label span, .cluster text {
          font-weight: 700;
          font-size: 13px;
        }
        .node text, .label text {
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 13px;
        }
        .edgeLabel rect, .edgeLabel span {
          rx: 3px;
          ry: 3px;
        }
        /* ER Diagram High-Contrast Enhancements */
        .entityBox {
          fill: ${isDark ? "#27272a" : isSepia ? "#fcf7ed" : "#ffffff"} !important;
          stroke: ${isDark ? "#e4e4e7" : isSepia ? "#78350f" : "#000000"} !important;
          stroke-width: 1.5px !important;
        }
        .relationshipLine {
          stroke: ${isDark ? "#f4f4f5" : isSepia ? "#451a03" : "#171717"} !important;
          stroke-width: 1.5px !important;
        }
        .relationshipLabelBox {
          fill: ${isDark ? "#18181b" : isSepia ? "#ebe0cb" : "#f3f4f6"} !important;
          opacity: 0.95 !important;
        }
        .edgeLabel .label text, .edgeLabel text, .relationshipLabel {
          fill: ${isDark ? "#ffffff" : isSepia ? "#292524" : "#000000"} !important;
          font-weight: 600 !important;
          font-size: 12px !important;
        }
        .node.default text, .node text, .label {
          fill: ${isDark ? "#ffffff" : isSepia ? "#292524" : "#000000"} !important;
          font-weight: 600 !important;
        }
        .marker {
          stroke: ${isDark ? "#f4f4f5" : isSepia ? "#451a03" : "#171717"} !important;
          fill: ${isDark ? "#f4f4f5" : isSepia ? "#451a03" : "#171717"} !important;
        }
        /* Prevent external or global paragraph styles from introducing rogue vertical spacing inside nodes */
        .node foreignObject, .label foreignObject {
          overflow: visible !important;
        }
        .node foreignObject p, .label foreignObject p, .edgeLabel foreignObject p {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.35 !important;
        }
      `,
      flowchart: {
        curve: "linear", // linear prevents cycle loops from slicing through nodes
        htmlLabels: true,
        subGraphTitleMargin: { top: 12, bottom: 8 },
        padding: 12,
        nodeSpacing: 40,
        rankSpacing: 40,
        useMaxWidth: false,
      },
      er: {
        useMaxWidth: false,
      },
      sequence: {
        useMaxWidth: false,
      },
    });

    currentConfiguredTheme = theme;
  }

  return mermaid;
}

export interface MermaidRenderResult {
  svg: string;
  error?: string;
}

/**
 * Renders a Mermaid diagram string into an SVG output.
 */
export async function renderMermaidDiagram(
  id: string,
  rawCode: string,
  theme: "light" | "dark" | "sepia" = "light"
): Promise<MermaidRenderResult> {
  const code = cleanMermaidCode(rawCode);
  if (!code) {
    return { svg: "", error: "Kode diagram kosong." };
  }

  try {
    const mermaid = await getMermaidInstance(theme);
    if (!mermaid) {
      return { svg: "", error: "Mermaid hanya dapat berjalan di browser." };
    }
    const sanitizedId = `mermaid-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}-${Math.random().toString(36).substring(2, 7)}`;

    // Validate syntax before rendering if parse is available
    if (typeof mermaid.parse === "function") {
      try {
        await mermaid.parse(code);
      } catch (parseErr: unknown) {
        const errMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        return {
          svg: "",
          error: errMsg.replace(/^Error:\s*/, ""),
        };
      }
    }

    const { svg } = await mermaid.render(sanitizedId, code);
    return { svg };
  } catch (err: unknown) {
    // Clean up any error element inserted into body by mermaid
    if (typeof document !== "undefined") {
      const errEl = document.querySelector(`[id^="d${id}"]`);
      if (errEl && errEl.parentNode) {
        errEl.parentNode.removeChild(errEl);
      }
    }

    const message = err instanceof Error ? err.message : String(err);
    return {
      svg: "",
      error: message.replace(/^Error:\s*/, "").split("\n")[0] || "Gagal merender diagram.",
    };
  }
}

/**
 * Triggers a download of the rendered SVG diagram as a standalone .svg file.
 */
export function downloadMermaidSvg(svgContent: string, filename = "diagram.svg") {
  if (typeof window === "undefined" || !svgContent) return;
  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
