import { describe, it, expect } from "vitest";
import { parseTags } from "@/lib/utils";

describe("parseTags", () => {
  it("returns empty array for empty string", () => {
    const fd = new FormData();
    fd.set("tags", "");
    expect(parseTags(fd)).toEqual([]);
  });

  it("returns empty array when tags key is missing", () => {
    expect(parseTags(new FormData())).toEqual([]);
  });

  it("parses comma-separated tags", () => {
    const fd = new FormData();
    fd.set("tags", "italian,pizza,casual");
    expect(parseTags(fd)).toEqual(["italian", "pizza", "casual"]);
  });

  it("trims whitespace from each tag", () => {
    const fd = new FormData();
    fd.set("tags", " italian , pizza , casual ");
    expect(parseTags(fd)).toEqual(["italian", "pizza", "casual"]);
  });

  it("filters out empty entries from trailing/double commas", () => {
    const fd = new FormData();
    fd.set("tags", "italian,,pizza,");
    expect(parseTags(fd)).toEqual(["italian", "pizza"]);
  });

  it("handles whitespace-only entries", () => {
    const fd = new FormData();
    fd.set("tags", "italian, ,pizza");
    expect(parseTags(fd)).toEqual(["italian", "pizza"]);
  });

  it("returns single tag without comma", () => {
    const fd = new FormData();
    fd.set("tags", "sushi");
    expect(parseTags(fd)).toEqual(["sushi"]);
  });
});
