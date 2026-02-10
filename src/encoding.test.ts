import { describe, it, expect } from "vitest";
import { detectEncoding, decode, encode } from "./encoding";

describe("detectEncoding", () => {
  it("detects UTF-8 BOM", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x69]);
    expect(detectEncoding(bytes)).toBe("utf-8");
  });

  it("detects UTF-16 LE BOM", () => {
    const bytes = new Uint8Array([0xff, 0xfe, 0x48, 0x00]);
    expect(detectEncoding(bytes)).toBe("utf-16le");
  });

  it("detects UTF-16 BE BOM", () => {
    const bytes = new Uint8Array([0xfe, 0xff, 0x00, 0x48]);
    expect(detectEncoding(bytes)).toBe("utf-16be");
  });

  it("detects plain ASCII as utf-8", () => {
    const bytes = new TextEncoder().encode("Hello World");
    expect(detectEncoding(bytes)).toBe("utf-8");
  });

  it("detects valid multi-byte UTF-8", () => {
    // "Ž" in UTF-8 is 0xC5 0xBD
    const bytes = new Uint8Array([0xc5, 0xbd]);
    expect(detectEncoding(bytes)).toBe("utf-8");
  });

  it("detects Windows-1250 for invalid UTF-8 with low high-byte ratio", () => {
    // Mostly ASCII with a few Windows-1250 high bytes (< 20% of non-whitespace)
    const ascii = new TextEncoder().encode("Hello World this is a test of encoding ");
    const bytes = new Uint8Array(ascii.length + 2);
    bytes.set(ascii);
    // Add 2 high bytes that are NOT valid UTF-8 lead bytes (0x80-0xBF range)
    bytes[ascii.length] = 0x9a; // š in Windows-1250
    bytes[ascii.length + 1] = 0x9e; // ž in Windows-1250
    expect(detectEncoding(bytes)).toBe("windows-1250");
  });

  it("detects Windows-1251 for invalid UTF-8 with high Cyrillic byte ratio", () => {
    // Simulate Cyrillic text encoded in Windows-1251: many bytes in 0xC0-0xFF range
    // "Привет" in Win-1251: CF D0 E8 E2 E5 F2
    const bytes = new Uint8Array([0xcf, 0xd0, 0xe8, 0xe2, 0xe5, 0xf2]);
    expect(detectEncoding(bytes)).toBe("windows-1251");
  });
});

describe("round-trip encode → decode", () => {
  it("utf-8 round-trip", () => {
    const text = "Žemlja i šuma";
    const encoded = encode(text, "utf-8");
    const decoded = decode(encoded, "utf-8");
    expect(decoded).toBe(text);
  });

  it("utf-16le round-trip", () => {
    const text = "Hello";
    const encoded = encode(text, "utf-16le");
    // Should start with BOM FF FE
    expect(encoded[0]).toBe(0xff);
    expect(encoded[1]).toBe(0xfe);
    const decoded = decode(encoded, "utf-16le");
    expect(decoded).toBe(text);
  });

  it("utf-16be round-trip", () => {
    const text = "Hello";
    const encoded = encode(text, "utf-16be");
    // Should start with BOM FE FF
    expect(encoded[0]).toBe(0xfe);
    expect(encoded[1]).toBe(0xff);
    const decoded = decode(encoded, "utf-16be");
    expect(decoded).toBe(text);
  });

  it("windows-1250 round-trip", () => {
    const text = "Dobar dan";
    const encoded = encode(text, "windows-1250");
    const decoded = decode(encoded, "windows-1250");
    expect(decoded).toBe(text);
  });

  it("windows-1251 round-trip for ASCII", () => {
    const text = "Privet";
    const encoded = encode(text, "windows-1251");
    const decoded = decode(encoded, "windows-1251");
    expect(decoded).toBe(text);
  });
});
