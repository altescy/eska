import { ElasticsearchOperationState } from "./elasticsearchOperation";

export interface PlaygroundState<T extends OperationState = ElasticsearchOperationState> {
  collectionId: string;
  clusterId?: string;
  clusterName?: string;
  operation?: T;
}
