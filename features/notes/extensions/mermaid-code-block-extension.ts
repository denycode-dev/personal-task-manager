import CodeBlock from "@tiptap/extension-code-block";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { MermaidCodeBlockNodeView } from "./mermaid-code-block-node-view";

/**
 * Enhanced CodeBlock extension for Tiptap with Mermaid diagram rendering.
 * Replaces standard codeBlock in StarterKit to allow interactive diagram preview,
 * syntax editing, SVG export, and zoom modals.
 */
export const MermaidCodeBlock = CodeBlock.extend({
  name: "codeBlock",

  addNodeView() {
    return ReactNodeViewRenderer(MermaidCodeBlockNodeView);
  },
});
