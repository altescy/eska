import { atomWithStorage } from "jotai/utils";
import { createSecureStorage } from "@/lib/storage";

const CLUSTERS_STORAGE_KEY = "eska:v0.0.1:clusters";
const CURRENT_CLUSTER_ID_STORAGE_KEY = "eska:v0.0.1:currentClusterId";

const secureStorage = createSecureStorage();

export const clustersAtom = atomWithStorage<string | null>(CLUSTERS_STORAGE_KEY, null, secureStorage);
export const currentClusterIdAtom = atomWithStorage<string | null | undefined>(CURRENT_CLUSTER_ID_STORAGE_KEY, null);
