import { useState, useRef, useEffect } from "react";
import { ResearchSettings, ResearchProgress, ResearchStats, TaskQueueItem } from "../types";
import { fetchSuggestions } from "../services/suggest";
import { delayHelper, removeDuplicates, sortAZ, sortZA } from "../utils/export";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

export function useKeywordResearch() {
  const [settings, setSettings] = useState<ResearchSettings>({
    delay: 300,
    retry: 2,
    concurrent: 3,
  });

  const [keyword, setKeyword] = useState("");
  const [progress, setProgress] = useState<ResearchProgress>({
    totalRequests: 52,
    completedRequests: 0,
    status: "idle",
    currentKeyword: "",
    errorCount: 0,
  });

  // Raw keywords including duplicates, used to calculate Card 1
  const [rawKeywords, setRawKeywords] = useState<string[]>([]);
  // Final unique keywords, used for display and exports
  const [finalKeywords, setFinalKeywords] = useState<string[]>([]);
  
  // Sort direction: "A-Z" or "Z-A"
  const [sortDirection, setSortDirection] = useState<"A-Z" | "Z-A">("A-Z");

  // Keep tasks queue in a ref so we can modify it across worker threads safely
  const queueRef = useRef<TaskQueueItem[]>([]);
  // Store toast alerts callback
  const toastRef = useRef<((message: string, type: "success" | "error" | "info") => void) | null>(null);

  // References to track current states in async workers to avoid stale closure issues
  const statusRef = useRef<"idle" | "running" | "paused" | "stopped" | "completed">("idle");
  statusRef.current = progress.status;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Track active worker count to know when all workers have finished
  const activeWorkersRef = useRef(0);

  // Update final unique keywords in real-time whenever raw keywords change or sort order changes
  useEffect(() => {
    const unique = removeDuplicates(rawKeywords);
    const sorted = sortDirection === "A-Z" ? sortAZ(unique) : sortZA(unique);
    setFinalKeywords(sorted);
  }, [rawKeywords, sortDirection]);

  const setToastHandler = (handler: (message: string, type: "success" | "error" | "info") => void) => {
    toastRef.current = handler;
  };

  const triggerToast = (message: string, type: "success" | "error" | "info" = "info") => {
    if (toastRef.current) {
      toastRef.current(message, type);
    }
  };

  // Helper to spawn workers
  const runWorkers = async () => {
    const concurrentCount = settingsRef.current.concurrent;
    activeWorkersRef.current = concurrentCount;

    for (let i = 0; i < concurrentCount; i++) {
      runWorker();
    }
  };

  // Individual worker loop
  const runWorker = async () => {
    try {
      while (statusRef.current === "running") {
        // Get next task
        const task = queueRef.current.shift();
        if (!task) {
          break; // Queue is empty, exit worker
        }

        // Update progress currentKeyword
        setProgress((prev) => ({
          ...prev,
          currentKeyword: task.query,
        }));

        let suggestions: string[] = [];
        let success = false;

        try {
          // Fetch from service
          suggestions = await fetchSuggestions(task.query, settingsRef.current.retry);
          success = true;
        } catch (error) {
          setProgress((prev) => ({
            ...prev,
            errorCount: prev.errorCount + 1,
          }));
        }

        // If stopped/paused while query was in-flight, discard or re-queue
        if (statusRef.current === "stopped") {
          break;
        }

        if (statusRef.current === "paused") {
          // Re-queue the task since we didn't fully commit it
          queueRef.current.unshift(task);
          break;
        }

        if (success && suggestions.length > 0) {
          setRawKeywords((prev) => [...prev, ...suggestions]);
        }

        // Increment completed requests
        setProgress((prev) => {
          const nextCompleted = prev.completedRequests + 1;
          const isFinished = nextCompleted >= prev.totalRequests;
          
          return {
            ...prev,
            completedRequests: nextCompleted,
            status: isFinished ? "completed" : prev.status,
          };
        });

        // Trigger finish if we just completed the last request
        if (queueRef.current.length === 0 && activeWorkersRef.current === 1 && statusRef.current === "running") {
          // Last running worker detects completion
          setProgress((prev) => ({ ...prev, status: "completed" }));
          triggerToast("Research Finished Successfully!", "success");
        }

        // Wait based on user-configured delay helper
        if (settingsRef.current.delay > 0) {
          await delayHelper(settingsRef.current.delay);
        }
      }
    } finally {
      activeWorkersRef.current = Math.max(0, activeWorkersRef.current - 1);
    }
  };

  const startResearch = (rawKeywordInput: string) => {
    const cleanedKeyword = rawKeywordInput.replace(/\s+/g, " ").trim();
    if (!cleanedKeyword || cleanedKeyword.length < 2) {
      triggerToast("Keyword must be at least 2 characters long.", "error");
      return;
    }
    if (cleanedKeyword.length > 150) {
      triggerToast("Keyword cannot exceed 150 characters.", "error");
      return;
    }

    setKeyword(cleanedKeyword);
    setRawKeywords([]);
    setFinalKeywords([]);

    // Generate 52 tasks
    const tasks: TaskQueueItem[] = [];
    
    // 26 suffix tasks (e.g. "keyword a")
    ALPHABET.forEach((letter) => {
      tasks.push({
        type: "suffix",
        letter,
        query: `${cleanedKeyword} ${letter}`,
      });
    });

    // 26 prefix tasks (e.g. "a keyword")
    ALPHABET.forEach((letter) => {
      tasks.push({
        type: "prefix",
        letter,
        query: `${letter} ${cleanedKeyword}`,
      });
    });

    queueRef.current = tasks;

    setProgress({
      totalRequests: tasks.length,
      completedRequests: 0,
      status: "running",
      currentKeyword: "",
      errorCount: 0,
    });

    triggerToast("Research Started", "success");

    // Spawn workers with concurrency
    setTimeout(() => {
      runWorkers();
    }, 50);
  };

  const stopResearch = () => {
    setProgress((prev) => ({ ...prev, status: "stopped" }));
    queueRef.current = [];
    triggerToast("Research Stopped", "info");
  };

  const pauseResearch = () => {
    setProgress((prev) => ({ ...prev, status: "paused" }));
    triggerToast("Research Paused", "info");
  };

  const resumeResearch = () => {
    setProgress((prev) => ({ ...prev, status: "running" }));
    triggerToast("Research Resumed", "success");
    
    // Restart workers to consume from queueRef.current
    setTimeout(() => {
      runWorkers();
    }, 50);
  };

  // Get statistics
  const stats: ResearchStats = {
    totalFound: rawKeywords.length,
    finalCount: finalKeywords.length,
    duplicatesRemoved: Math.max(0, rawKeywords.length - finalKeywords.length),
  };

  return {
    keyword,
    setKeyword,
    settings,
    setSettings,
    progress,
    stats,
    finalKeywords,
    sortDirection,
    setSortDirection,
    startResearch,
    stopResearch,
    pauseResearch,
    resumeResearch,
    setToastHandler,
    triggerToast,
  };
}
