import { describe, expect, test } from "vitest";
import { uuid4 } from "./uuid";

describe("uuid", () => {
  describe("uuid4", () => {
    test("should generate valid UUID v4 format", () => {
      const uuid = uuid4();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    test("should generate unique UUIDs", () => {
      const uuid1 = uuid4();
      const uuid2 = uuid4();
      const uuid3 = uuid4();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    test("should generate UUID with correct version", () => {
      const uuid = uuid4();
      const version = uuid.charAt(14);

      expect(version).toBe("4");
    });

    test("should generate UUID with correct variant", () => {
      const uuid = uuid4();
      const variant = uuid.charAt(19);

      // Variant bits should be 10xx (8, 9, a, or b in hex)
      expect(["8", "9", "a", "b"]).toContain(variant.toLowerCase());
    });

    test("should generate 100 unique UUIDs", () => {
      const uuids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        uuids.add(uuid4());
      }

      expect(uuids.size).toBe(100);
    });
  });
});
