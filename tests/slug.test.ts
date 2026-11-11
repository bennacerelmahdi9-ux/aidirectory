import { describe, it, expect } from "vitest";
import { slugify } from "../src/lib/slug";

describe("slugify", () => {
  it("slugifies a name", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
  it("trims and collapses", () => {
    expect(slugify("  A--B  ")).toBe("a-b");
  });
});
