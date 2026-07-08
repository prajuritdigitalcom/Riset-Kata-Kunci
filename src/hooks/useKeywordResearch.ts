import { useState, useRef, useEffect } from "react";
import { ResearchSettings, ResearchProgress, ResearchStats, TaskQueueItem } from "../types";
import { fetchSuggestions } from "../services/suggest";
import { delayHelper, removeDuplicates, sortAZ, sortZA } from "../utils/export";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

/**
 * Mendeteksi bahasa (hl) dan negara (gl) secara otomatis berdasarkan kata kunci yang diinput.
 */
function detectLanguageAndCountry(keyword: string): { hl: string; gl: string } {
  const kw = keyword.toLowerCase().trim();
  
  // Kosakata bahasa Indonesia umum (termasuk kata hubung, kata keterangan, kata benda khas)
  const indonesianWords = [
    "terapi", "bekam", "jasa", "murah", "beli", "jual", "harga", "cara", "resep", "obat",
    "terdekat", "di", "yang", "dan", "untuk", "dengan", "adalah", "bisa", "buat", "makan",
    "wisata", "hotel", "tempat", "bagus", "kuliner", "sewa", "rental", "kursus", "belajar",
    "sekolah", "rumah", "mobil", "motor", "hp", "terbaik", "terbaru", "promo", "diskon",
    "apa", "mengapa", "bagaimana", "kapan", "siapa", "dimana", "alamat", "nomor", "kontak",
    "telepon", "wa", "whatsapp", "daerah", "kota", "kabupaten", "provinsi", "indonesia",
    "jakarta", "bandung", "surabaya", "medan", "semarang", "makassar", "palembang", "bali",
    "bandung", "jogja", "yogyakarta", "solo", "malang", "bogor", "depok", "tangerang", "bekasi",
    "sakit", "sehat", "pijat", "urut", "klinik", "dokter", "rs", "herbal", "alami", "madu"
  ];
  
  const words = kw.split(/[^a-zA-Z]+/);
  const hasIndonesianWord = words.some(w => indonesianWords.includes(w));
  // Pola akhiran/imbuhan khas bahasa Indonesia seperti "ng", "nya", atau awalan "di", "me", "ber", "se"
  const hasIndonesianPattern = /[aiueo]ng\b/.test(kw) || /nya\b/.test(kw) || /\b(se|me|ber|per|ke|di)[a-z]{3,}/.test(kw);
  
  if (hasIndonesianWord || hasIndonesianPattern) {
    return { hl: "id", gl: "id" };
  }
  
  // Default ke English (US) jika tidak terdeteksi Indonesia
  return { hl: "en", gl: "us" };
}

export function useKeywordResearch() {
  const [settings, setSettings] = useState<ResearchSettings>({
    delay: 300,
    retry: 2,
    concurrent: 3,
    hl: "id",
    gl: "id",
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
  useEffect(() => {
    statusRef.current = progress.status;
  }, [progress.status]);

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
          suggestions = await fetchSuggestions(
            task.query,
            settingsRef.current.retry,
            settingsRef.current.hl,
            settingsRef.current.gl
          );
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
          statusRef.current = "completed";
          setProgress((prev) => ({ ...prev, status: "completed" }));
          triggerToast("Riset selesai dengan sukses!", "success");
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
      triggerToast("Kata kunci minimal harus 2 karakter.", "error");
      return;
    }
    if (cleanedKeyword.length > 150) {
      triggerToast("Kata kunci tidak boleh melebihi 150 karakter.", "error");
      return;
    }

    // Deteksi bahasa dan negara otomatis dari input kata kunci
    const detected = detectLanguageAndCountry(cleanedKeyword);
    setSettings((prev) => ({
      ...prev,
      hl: detected.hl,
      gl: detected.gl,
    }));

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
    statusRef.current = "running";

    setProgress({
      totalRequests: tasks.length,
      completedRequests: 0,
      status: "running",
      currentKeyword: "",
      errorCount: 0,
    });

    triggerToast("Riset kata kunci dimulai...", "success");

    // Spawn workers with concurrency
    setTimeout(() => {
      runWorkers();
    }, 50);
  };

  const stopResearch = () => {
    statusRef.current = "stopped";
    setProgress((prev) => ({ ...prev, status: "stopped" }));
    queueRef.current = [];
    triggerToast("Riset dihentikan", "info");
  };

  const pauseResearch = () => {
    statusRef.current = "paused";
    setProgress((prev) => ({ ...prev, status: "paused" }));
    triggerToast("Riset dijeda", "info");
  };

  const resumeResearch = () => {
    statusRef.current = "running";
    setProgress((prev) => ({ ...prev, status: "running" }));
    triggerToast("Riset dilanjutkan", "success");
    
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
