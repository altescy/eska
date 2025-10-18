import { ElasticsearchOperationState } from "./elasticsearchOperation";
import { ElasticsearchCollection } from "./collection";

export interface PlaygroundState<T extends OperationState = ElasticsearchOperationState> {
  clusterId?: string;
  clusterName?: string;
  operation?: T;
  collection?: ElasticsearchCollection;
}
