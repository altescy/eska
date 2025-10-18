import { ElasticsearchOperation } from "./elasticsearchOperation";

export interface BaseOperationState<Operation extends ElasticsearchOperation> {
  type: Operation;
}

export interface SearchOperationState extends BaseOperationState<"search"> {
  indexName?: string;
  query?: string;
  response?: string;
}

type OperationState = SearchOperationState;

export interface PlaygroundState<T extends OperationState = OperationState> {
  clusterId?: string;
  operation?: T;
}
