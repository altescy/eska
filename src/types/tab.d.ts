import type { PlaygroundState } from "@/types/playground";

export type TabType = "playground";
export interface BaseTab<Type extends TabType, State> {
  id: string;
  type: Type;
  state: State;
  title?: string;
}

export type PlaygroundTab = BaseTab<"playground", PlaygroundState>;
export type Tab = PlaygroundTab;
