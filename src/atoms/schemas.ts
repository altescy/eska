import { atom } from "jotai";
import type { ElasticsearchIndexMapping } from "@/types/elasticsearch";

export interface Schemas {
  [indexName: string]: {
    schema: JSONSchema;
    mapping: ElasticsearchIndexMapping;
    timestamp: number;
  };
}

export const schemasAtom = atom<Schemas>({});
