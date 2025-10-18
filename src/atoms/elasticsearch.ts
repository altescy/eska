import { atom } from "jotai";
import type { ElasticsearchGetIndicesResponse } from "@/types/elasticsearch";

export const cachedIndicesAtom = atom<Record<string, ElasticsearchGetIndicesResponse>>({});
