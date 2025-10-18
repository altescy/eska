import { atomWithStorage } from "jotai/utils";
import type { Collection } from "@/types/collection";

const COLLECTIONS_STORAGE_KEY = "eska:v0.0.1:collections";

export const collectionsAtom = atomWithStorage<Collection[]>(COLLECTIONS_STORAGE_KEY, []);
