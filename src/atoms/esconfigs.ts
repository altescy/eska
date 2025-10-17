import { atomWithStorage } from "jotai/utils";
import type { ElasticsearchConfig } from "@/types/elasticsearch";

const STORAGE_KEY = "elasticsearchConfigs";

export interface ElasticsearchConfigEntry {
  name: string;
  config: ElasticsearchConfig;
}

export const ElasticsearchConfigsAtom = atomWithStorage<{ [key: string]: ElasticsearchConfig }>(STORAGE_KEY, {});
