import { createStore } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Collection } from "@/types/collection";
import type { Tab } from "@/types/tab";

// jotai v3 removed the extra re-render that `useAtomValue` performed right after
// mounting. `atomWithStorage` reads from storage in `onMount`, so without
// `getOnInit` the first render sees the initial value and never re-renders --
// persisted tabs and settings stay invisible until something else updates the
// atom. These tests assert the stored value is already there before any mount.
describe("persisted atoms hydrate before mount", () => {
  const entries = new Map<string, string>();

  beforeEach(() => {
    entries.clear();
    const localStorage = {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    };
    // jotai's default JSON storage reads `window.localStorage`, while
    // `createSecureStorage` reads the bare `localStorage` global.
    vi.stubGlobal("window", { localStorage });
    vi.stubGlobal("localStorage", localStorage);
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores tabs and the active tab", async () => {
    const tabs: Pick<Tab, "id">[] = [{ id: "tab-1" }, { id: "tab-2" }];
    entries.set("eska:v0.0.1:tabs", JSON.stringify(tabs));
    entries.set("eska:v0.0.1:activeTabId", JSON.stringify("tab-2"));

    const { tabsAtom, activeTabIdAtom, activeTabAtom } = await import("@/atoms/tabs");
    const store = createStore();

    expect(store.get(tabsAtom)).toHaveLength(2);
    expect(store.get(activeTabIdAtom)).toBe("tab-2");
    expect(store.get(activeTabAtom)?.id).toBe("tab-2");
  });

  it("restores editor settings", async () => {
    entries.set("eska:v0.0.1:editorSettings", JSON.stringify({ fontSize: 20, keyBinding: "vim" }));

    const { editorSettingsAtom } = await import("@/atoms/editor");

    expect(createStore().get(editorSettingsAtom)).toMatchObject({ fontSize: 20, keyBinding: "vim" });
  });

  it("restores collections", async () => {
    const collections: Pick<Collection, "id">[] = [{ id: "collection-1" }];
    entries.set("eska:v0.0.1:collections", JSON.stringify(collections));

    const { collectionsAtom } = await import("@/atoms/collections");

    expect(createStore().get(collectionsAtom)).toHaveLength(1);
  });

  it("restores clusters from secure storage", async () => {
    const encrypted = JSON.stringify({ encrypted: "cipher-text" });
    entries.set("secure:eska:v0.0.1:clusters", encrypted);
    entries.set("eska:v0.0.1:currentClusterId", JSON.stringify("cluster-1"));

    const { clustersAtom, currentClusterIdAtom } = await import("@/atoms/clusters");
    const store = createStore();

    expect(store.get(clustersAtom)).toBe(encrypted);
    expect(store.get(currentClusterIdAtom)).toBe("cluster-1");
  });
});
