const SECURE_STORAGE_PREFIX = "secure:";

interface SecureStorageData {
  encrypted: string;
}

interface SecureStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, newValue: string | null) => void;
  removeItem: (key: string) => void;
  subscribe?: (key: string, callback: (value: string | null) => void) => () => void;
}

export function createSecureStorage(): SecureStorage {
  return {
    getItem: (key: string): string | null => {
      const storageKey = `${SECURE_STORAGE_PREFIX}${key}`;
      const item = localStorage.getItem(storageKey);

      if (item === null) {
        return null;
      }

      try {
        // Validate that it's a SecureStorageData structure
        JSON.parse(item) as SecureStorageData;
        return item;
      } catch {
        return null;
      }
    },
    setItem: (key: string, newValue: string | null): void => {
      const storageKey = `${SECURE_STORAGE_PREFIX}${key}`;
      if (newValue === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, newValue);
      }
    },
    removeItem: (key: string): void => {
      const storageKey = `${SECURE_STORAGE_PREFIX}${key}`;
      localStorage.removeItem(storageKey);
    },
    subscribe: (key: string, callback: (value: string | null) => void) => {
      const storageKey = `${SECURE_STORAGE_PREFIX}${key}`;
      const listener = (e: StorageEvent) => {
        if (e.key === storageKey) {
          callback(e.newValue);
        }
      };
      window.addEventListener("storage", listener);
      return () => {
        window.removeEventListener("storage", listener);
      };
    },
  };
}

export async function encryptData<T>(data: T): Promise<string> {
  const isAvailable = await window.safeStorage.isEncryptionAvailable();
  const jsonString = JSON.stringify(data);

  if (!isAvailable) {
    console.warn("Encryption is not available. Data will be stored in plain text.");
    return jsonString;
  }

  const encrypted = await window.safeStorage.encryptString(jsonString);
  const secureData: SecureStorageData = { encrypted };
  return JSON.stringify(secureData);
}

export async function decryptData<T>(encryptedString: string): Promise<T | null> {
  try {
    const data: SecureStorageData = JSON.parse(encryptedString);

    if (!data.encrypted) {
      // Fallback: data might be stored in plain text
      return JSON.parse(encryptedString) as T;
    }

    const isAvailable = await window.safeStorage.isEncryptionAvailable();

    if (!isAvailable) {
      console.warn("Encryption is not available. Cannot decrypt data.");
      return null;
    }

    const decrypted = await window.safeStorage.decryptString(data.encrypted);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error("Failed to decrypt data:", error);
    return null;
  }
}
