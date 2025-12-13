import { atom } from "jotai";
import type { ElasticsearchIndexMapping } from "@/types/elasticsearch";

export interface SchemaCache {
  [indexName: string]: {
    schema: JSONSchema;
    mapping: ElasticsearchIndexMapping;
    timestamp: number;
  };
}

export const schemaCacheAtom = atom<SchemaCache>({});
