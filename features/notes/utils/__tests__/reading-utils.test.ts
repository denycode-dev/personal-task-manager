import {
  calculateReadingStats,
  extractTableOfContents,
  extractPlainText,
  DEFAULT_READER_PREFERENCES,
} from "../reading-utils";

describe("reading-utils", () => {
  it("should have correct default reader preferences", () => {
    expect(DEFAULT_READER_PREFERENCES.fontSize).toBe("base");
    expect(DEFAULT_READER_PREFERENCES.containerWidth).toBe("wide");
    expect(DEFAULT_READER_PREFERENCES.theme).toBe("light");
    expect(DEFAULT_READER_PREFERENCES.focusMode).toBe(false);
  });

  it("should calculate reading stats correctly for plain string", () => {
    const text = "Ini adalah contoh teks catatan publik untuk pengujian pembaca.";
    const stats = calculateReadingStats(text);
    expect(stats.words).toBe(9);
    expect(stats.readingTimeMinutes).toBe(1);
    expect(stats.characters).toBe(text.length);
  });

  it("should return zero stats for empty content", () => {
    const stats = calculateReadingStats(null);
    expect(stats.words).toBe(0);
    expect(stats.readingTimeMinutes).toBe(0);
  });

  it("should extract headings correctly for table of contents", () => {
    const tiptapJson = {
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: "Pengenalan Arsitektur" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: "Paragraf penjelasan di sini." }],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Fitur Utama" }],
        },
      ],
    };

    const toc = extractTableOfContents(tiptapJson);
    expect(toc).toHaveLength(2);
    expect(toc[0].text).toBe("Pengenalan Arsitektur");
    expect(toc[0].level).toBe(1);
    expect(toc[1].text).toBe("Fitur Utama");
    expect(toc[1].level).toBe(2);
  });

  it("should extract plain text from tiptap JSON", () => {
    const tiptapJson = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Halo dunia catatan." }],
        },
      ],
    };

    const text = extractPlainText(tiptapJson);
    expect(text.trim()).toBe("Halo dunia catatan.");
  });
});
