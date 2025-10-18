import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { Tab } from "@/types/tab";

const TABS_STORAGE_KEY = "eska:v0.0.1:tabs";
const ACTIVE_TAB_ID_STORAGE_KEY = "eska:v0.0.1:activeTabId";

export const tabsAtom = atomWithStorage<Tab[]>(TABS_STORAGE_KEY, []);
export const activeTabIdAtom = atomWithStorage<string | null | undefined>(ACTIVE_TAB_ID_STORAGE_KEY, null);
export const activeTabAtom = atom((get) => {
  const tabs = get(tabsAtom);
  const activeTabId = get(activeTabIdAtom);
  return tabs.find((tab) => tab.id === activeTabId);
});
