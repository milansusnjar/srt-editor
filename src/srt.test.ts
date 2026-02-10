import { describe, it, expect } from "vitest";
import { parseSrt, serializeSrt, parseTimestamp, formatTimestamp } from "./srt";

describe("parseTimestamp", () => {
  it("parses 00:00:00,000 as 0ms", () => {
    expect(parseTimestamp("00:00:00,000")).toBe(0);
  });

  it("parses a typical timestamp", () => {
    expect(parseTimestamp("01:02:03,456")).toBe(
      1 * 3600000 + 2 * 60000 + 3 * 1000 + 456,
    );
  });

  it("throws on invalid format", () => {
    expect(() => parseTimestamp("1:2:3,4")).toThrow("Invalid timestamp");
  });
});

describe("formatTimestamp", () => {
  it("formats 0ms as 00:00:00,000", () => {
    expect(formatTimestamp(0)).toBe("00:00:00,000");
  });

  it("formats a large value correctly", () => {
    const ms = 2 * 3600000 + 30 * 60000 + 45 * 1000 + 123;
    expect(formatTimestamp(ms)).toBe("02:30:45,123");
  });
});

describe("parseSrt", () => {
  it("parses a basic subtitle block", () => {
    const srt = `1
00:00:01,000 --> 00:00:02,000
Hello world`;
    const subs = parseSrt(srt);
    expect(subs).toHaveLength(1);
    expect(subs[0]).toEqual({
      index: 1,
      startMs: 1000,
      endMs: 2000,
      lines: ["Hello world"],
    });
  });

  it("parses multi-line subtitle text", () => {
    const srt = `1
00:00:01,000 --> 00:00:03,000
Line one
Line two
Line three`;
    const subs = parseSrt(srt);
    expect(subs).toHaveLength(1);
    expect(subs[0].lines).toEqual(["Line one", "Line two", "Line three"]);
  });

  it("parses multiple subtitle blocks", () => {
    const srt = `1
00:00:01,000 --> 00:00:02,000
First

2
00:00:03,000 --> 00:00:04,000
Second`;
    const subs = parseSrt(srt);
    expect(subs).toHaveLength(2);
    expect(subs[0].index).toBe(1);
    expect(subs[1].index).toBe(2);
  });

  it("handles \\r\\n line endings", () => {
    const srt = "1\r\n00:00:01,000 --> 00:00:02,000\r\nHello";
    const subs = parseSrt(srt);
    expect(subs).toHaveLength(1);
    expect(subs[0].lines).toEqual(["Hello"]);
  });
});

describe("serializeSrt", () => {
  it("serializes a single subtitle", () => {
    const result = serializeSrt([
      { index: 1, startMs: 1000, endMs: 2000, lines: ["Hello"] },
    ]);
    expect(result).toBe("1\n00:00:01,000 --> 00:00:02,000\nHello\n");
  });

  it("re-indexes subtitles starting from 1", () => {
    const result = serializeSrt([
      { index: 5, startMs: 1000, endMs: 2000, lines: ["A"] },
      { index: 10, startMs: 3000, endMs: 4000, lines: ["B"] },
    ]);
    expect(result).toContain("1\n00:00:01,000");
    expect(result).toContain("2\n00:00:03,000");
  });
});

describe("round-trip", () => {
  it("parse → serialize → parse produces same result", () => {
    const srt = `1
00:00:01,500 --> 00:00:03,200
First line
Second line

2
00:00:05,000 --> 00:00:07,800
Another subtitle`;
    const first = parseSrt(srt);
    const serialized = serializeSrt(first);
    const second = parseSrt(serialized);

    expect(second).toEqual(first);
  });
});
