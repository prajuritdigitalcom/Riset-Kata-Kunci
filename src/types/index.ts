export interface ResearchSettings {
  delay: number; // in ms
  retry: number;
  concurrent: number;
}

export interface KeywordItem {
  no: number;
  keyword: string;
}

export interface ResearchProgress {
  totalRequests: number;
  completedRequests: number;
  status: "idle" | "running" | "paused" | "stopped" | "completed";
  currentKeyword: string;
  errorCount: number;
}

export interface ResearchStats {
  totalFound: number;
  duplicatesRemoved: number;
  finalCount: number;
}

export interface TaskQueueItem {
  type: "prefix" | "suffix";
  letter: string;
  query: string;
}
