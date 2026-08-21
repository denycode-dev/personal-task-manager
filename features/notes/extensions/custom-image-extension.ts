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
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("data-width") ||
          element.style.width ||
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
          element.getAttribute("data-alignment") || "center",
        renderHTML: (attributes) => {
          return {
            "data-alignment": attributes.alignment || "center",
          };
        },
      },
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") || "",
        renderHTML: (attributes) => {
          return {
            "data-caption": attributes.caption || "",
          };
        },
      },
    };
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
      { class: `note-image-wrapper ${alignClass}` },
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
