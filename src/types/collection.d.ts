import type { ElasticsearchOperationState } from "./elasticsearch";

export type CollectionType = "elasticsearch";

export interface BaseCollection<T extends CollectionType, Content> {
  id: string;
  type: T;
  name: string;
  content: Content;
  createdAt: number;
  updatedAt: number;
}

export type ElasticsearchCollection = BaseCollection<"elasticsearch", ElasticsearchOperationState>;

export type Collection = ElasticsearchCollection;
