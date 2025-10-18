import { atomWithStorage } from "jotai/utils";
import type { Cluster } from "@/types/cluster";

const STORAGE_KEY = "eska:v0.0.1:clusters";

export const clustersAtom = atomWithStorage<Cluster[]>(STORAGE_KEY, []);
