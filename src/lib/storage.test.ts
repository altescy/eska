import { beforeEach, describe, expect, test, vi } from "vitest";
import { createSecureStorage, decryptData, encryptData } from "./storage";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

describe("storage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe("createSecureStorage", () => {
    test("should get null for non-existent key", () => {
      const storage = createSecureStorage();
      const value = storage.getItem("test-key");

      expect(value).toBeNull();
    });

    test("should store and retrieve encrypted data", () => {
      const storage = createSecureStorage();
      const testData = JSON.stringify({ encrypted: "test-encrypted-data" });

      storage.setItem("test-key", testData);
      const retrieved = storage.getItem("test-key");

      expect(retrieved).toBe(testData);
    });

    test("should use secure prefix for storage keys", () => {
      const storage = createSecureStorage();
      const testData = JSON.stringify({ encrypted: "test-data" });

      storage.setItem("test-key", testData);

      expect(localStorage.getItem("secure:test-key")).toBe(testData);
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    test("should remove item", () => {
      const storage = createSecureStorage();
      const testData = JSON.stringify({ encrypted: "test-data" });

      storage.setItem("test-key", testData);
      expect(storage.getItem("test-key")).toBe(testData);

      storage.removeItem("test-key");
      expect(storage.getItem("test-key")).toBeNull();
    });

    test("should remove item when setting null", () => {
      const storage = createSecureStorage();
      const testData = JSON.stringify({ encrypted: "test-data" });

      storage.setItem("test-key", testData);
      expect(storage.getItem("test-key")).toBe(testData);

      storage.setItem("test-key", null);
      expect(storage.getItem("test-key")).toBeNull();
    });

    test("should return null for invalid JSON", () => {
      const storage = createSecureStorage();

      localStorage.setItem("secure:test-key", "invalid-json");
      const value = storage.getItem("test-key");

      expect(value).toBeNull();
    });

    test("should validate SecureStorageData structure", () => {
      const storage = createSecureStorage();

      // Valid structure
      const validData = JSON.stringify({ encrypted: "test-data" });
      storage.setItem("valid-key", validData);
      expect(storage.getItem("valid-key")).toBe(validData);

      // Still valid JSON, but not SecureStorageData structure
      localStorage.setItem("secure:other-key", JSON.stringify({ other: "data" }));
      expect(storage.getItem("other-key")).toBe(JSON.stringify({ other: "data" }));
    });
  });

  describe("encryptData", () => {
    test("should encrypt data when encryption is available", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(true),
        encryptString: vi.fn().mockResolvedValue("encrypted-string"),
        decryptString: vi.fn(),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const data = { test: "data", value: 123 };
      const result = await encryptData(data);

      expect(mockSafeStorage.isEncryptionAvailable).toHaveBeenCalled();
      expect(mockSafeStorage.encryptString).toHaveBeenCalledWith(JSON.stringify(data));
      expect(result).toBe(JSON.stringify({ encrypted: "encrypted-string" }));
    });

    test("should store plain text when encryption is not available", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(false),
        encryptString: vi.fn(),
        decryptString: vi.fn(),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const data = { test: "data", value: 123 };
      const result = await encryptData(data);

      expect(mockSafeStorage.isEncryptionAvailable).toHaveBeenCalled();
      expect(mockSafeStorage.encryptString).not.toHaveBeenCalled();
      expect(result).toBe(JSON.stringify(data));
    });
  });

  describe("decryptData", () => {
    test("should decrypt encrypted data", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(true),
        encryptString: vi.fn(),
        decryptString: vi.fn().mockResolvedValue(JSON.stringify({ test: "data" })),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const encryptedString = JSON.stringify({ encrypted: "encrypted-data" });
      const result = await decryptData<{ test: string }>(encryptedString);

      expect(mockSafeStorage.isEncryptionAvailable).toHaveBeenCalled();
      expect(mockSafeStorage.decryptString).toHaveBeenCalledWith("encrypted-data");
      expect(result).toEqual({ test: "data" });
    });

    test("should handle plain text fallback", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(true),
        encryptString: vi.fn(),
        decryptString: vi.fn(),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const plainTextData = JSON.stringify({ test: "data" });
      const result = await decryptData<{ test: string }>(plainTextData);

      expect(result).toEqual({ test: "data" });
      expect(mockSafeStorage.decryptString).not.toHaveBeenCalled();
    });

    test("should return null when encryption is not available", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(false),
        encryptString: vi.fn(),
        decryptString: vi.fn(),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const encryptedString = JSON.stringify({ encrypted: "encrypted-data" });
      const result = await decryptData(encryptedString);

      expect(mockSafeStorage.isEncryptionAvailable).toHaveBeenCalled();
      expect(mockSafeStorage.decryptString).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    test("should return null on decryption error", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(true),
        encryptString: vi.fn(),
        decryptString: vi.fn().mockRejectedValue(new Error("Decryption failed")),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const encryptedString = JSON.stringify({ encrypted: "encrypted-data" });
      const result = await decryptData(encryptedString);

      expect(result).toBeNull();
    });

    test("should return null for invalid JSON", async () => {
      const mockSafeStorage = {
        isEncryptionAvailable: vi.fn().mockResolvedValue(true),
        encryptString: vi.fn(),
        decryptString: vi.fn(),
      };

      global.window = { safeStorage: mockSafeStorage } as unknown as Window & typeof globalThis;

      const result = await decryptData("invalid-json");

      expect(result).toBeNull();
    });
  });
});
