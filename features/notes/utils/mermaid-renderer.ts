/**
 * Client-side Mermaid utility for Next.js App Router.
 * Dynamically imports mermaid to prevent SSR issues and keep bundle size optimal.
 */

let mermaidInitialized = false;

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
 * Normalizes mermaid code by trimming extra blank lines and ensuring valid indentation.
 */
export function cleanMermaidCode(code: string): string {
  if (!code) return "";
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();
}

/**
 * Safely loads and initializes mermaid singleton instance on the client.
 */
async function getMermaidInstance() {
  if (typeof window === "undefined") {
    throw new Error("Mermaid can only be initialized on the client side.");
  }

  const mermaidModule = await import("mermaid");
  const mermaid = mermaidModule.default;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      theme: "neutral",
      themeVariables: {
        primaryColor: "#fef08a", // yellow-200
        primaryTextColor: "#171717",
        primaryBorderColor: "#000000",
        lineColor: "#000000",
        secondaryColor: "#ffffff",
        tertiaryColor: "#f3f4f6",
        edgeLabelBackground: "#ffffff",
        nodeBorder: "#000000",
        mainBkg: "#ffffff",
        clusterBkg: "#f9fafb",
        clusterBorder: "#000000",
        titleColor: "#000000",
        actorBorder: "#000000",
        actorBkg: "#fef08a",
      },
      flowchart: {
        curve: "basis",
        htmlLabels: true,
      },
      sequence: {
        useMaxWidth: true,
      },
    });
    mermaidInitialized = true;
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
  rawCode: string
): Promise<MermaidRenderResult> {
  const code = cleanMermaidCode(rawCode);
  if (!code) {
    return { svg: "", error: "Kode diagram kosong." };
  }

  try {
    const mermaid = await getMermaidInstance();
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
