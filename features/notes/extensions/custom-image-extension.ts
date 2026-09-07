import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, mergeAttributes } from "@tiptap/react";
import { CustomImageNodeView } from "./custom-image-node-view";

export interface CustomImageOptions {
  inline: boolean;
  allowBase64: boolean;
  HTMLAttributes: Record<string, unknown>;
}

export const CustomImage = Image.extend({
  name: "image",

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("src") ||
          element.getAttribute("data-src") ||
          element.querySelector("img")?.getAttribute("src") ||
          element.querySelector("img")?.getAttribute("data-src") ||
          null,
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      alt: {
        default: "Gambar Catatan",
        parseHTML: (element) =>
          element.getAttribute("alt") ||
          element.getAttribute("data-alt") ||
          element.querySelector("img")?.getAttribute("alt") ||
          "Gambar Catatan",
        renderHTML: (attributes) => {
          return { alt: attributes.alt || "Gambar Catatan" };
        },
      },
      title: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("title") ||
          element.querySelector("img")?.getAttribute("title") ||
          null,
        renderHTML: (attributes) => {
          return attributes.title ? { title: attributes.title } : {};
        },
      },
      fileId: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-file-id") ||
          element.querySelector("img")?.getAttribute("data-file-id") ||
          null,
        renderHTML: (attributes) => {
          return attributes.fileId ? { "data-file-id": attributes.fileId } : {};
        },
      },
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("data-width") ||
          element.querySelector("img")?.getAttribute("data-width") ||
          element.style?.width ||
          "100%",
        renderHTML: (attributes) => {
          return {
            "data-width": attributes.width || "100%",
            style: `width: ${attributes.width || "100%"}; max-width: 100%;`,
          };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (element) =>
          element.getAttribute("data-alignment") ||
          element.querySelector("img")?.getAttribute("data-alignment") ||
          "center",
        renderHTML: (attributes) => {
          return {
            "data-alignment": attributes.alignment || "center",
          };
        },
      },
      caption: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-caption") ||
          element.querySelector("img")?.getAttribute("data-caption") ||
          "",
        renderHTML: (attributes) => {
          return {
            "data-caption": attributes.caption || "",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div.note-image-wrapper",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const img = element.querySelector("img");
          const src =
            img?.getAttribute("src") ||
            img?.getAttribute("data-src") ||
            element.getAttribute("data-src") ||
            null;
          if (!src) return false;
          return {
            src,
            alt: img?.getAttribute("alt") || element.getAttribute("data-alt") || "Gambar Catatan",
            fileId: img?.getAttribute("data-file-id") || element.getAttribute("data-file-id") || null,
            width: img?.getAttribute("data-width") || element.getAttribute("data-width") || element.style.width || "100%",
            alignment: element.getAttribute("data-alignment") || img?.getAttribute("data-alignment") || "center",
            caption: img?.getAttribute("data-caption") || element.getAttribute("data-caption") || "",
          };
        },
      },
      {
        tag: "div[data-node-view-wrapper]",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const img = element.querySelector("img");
          const src =
            img?.getAttribute("src") ||
            img?.getAttribute("data-src") ||
            element.getAttribute("data-src") ||
            null;
          if (!src) return false;
          return {
            src,
            alt: img?.getAttribute("alt") || "Gambar Catatan",
            fileId: img?.getAttribute("data-file-id") || element.getAttribute("data-file-id") || null,
            width: img?.getAttribute("data-width") || element.getAttribute("data-width") || "100%",
            alignment: element.getAttribute("data-alignment") || img?.getAttribute("data-alignment") || "center",
            caption: img?.getAttribute("data-caption") || element.getAttribute("data-caption") || "",
          };
        },
      },
      {
        tag: this.options.allowBase64 ? "img[src]" : 'img[src]:not([src^="data:"])',
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const src = element.getAttribute("src") || element.getAttribute("data-src") || null;
          if (!src) return false;
          return {
            src,
            alt: element.getAttribute("alt") || "Gambar Catatan",
            fileId: element.getAttribute("data-file-id") || null,
            width: element.getAttribute("data-width") || element.style.width || "100%",
            alignment: element.getAttribute("data-alignment") || "center",
            caption: element.getAttribute("data-caption") || "",
          };
        },
      },
      {
        tag: "img",
        getAttrs: (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const src = element.getAttribute("src") || element.getAttribute("data-src") || null;
          if (!src) return false;
          return {
            src,
            alt: element.getAttribute("alt") || "Gambar Catatan",
            fileId: element.getAttribute("data-file-id") || null,
            width: element.getAttribute("data-width") || element.style.width || "100%",
            alignment: element.getAttribute("data-alignment") || "center",
            caption: element.getAttribute("data-caption") || "",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = (HTMLAttributes["data-alignment"] as string) || "center";
    const width = (HTMLAttributes["data-width"] as string) || "100%";

    const alignClass =
      alignment === "left"
        ? "text-left my-4"
        : alignment === "right"
        ? "text-right my-4"
        : "text-center my-4";

    return [
      "div",
      {
        class: `note-image-wrapper ${alignClass}`,
        "data-alignment": alignment,
        "data-width": width,
        "data-src": (HTMLAttributes.src as string) || undefined,
        "data-file-id": (HTMLAttributes["data-file-id"] as string) || undefined,
      },
      [
        "img",
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
          class:
            "inline-block border-2 border-black/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.15)] rounded-none",
          style: `width: ${width}; max-width: 100%; height: auto;`,
        }),
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomImageNodeView);
  },
});
