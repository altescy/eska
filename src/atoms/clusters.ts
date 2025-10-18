import { atomWithStorage } from "jotai/utils";
import { createSecureStorage } from "@/lib/secureStorage";

const STORAGE_KEY = "eska:v0.0.1:clusters";

const secureStorage = createSecureStorage();

// Atom that stores encrypted cluster data as a string
export const clustersAtom = atomWithStorage<string | null>(STORAGE_KEY, null, secureStorage);
