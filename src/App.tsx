import React, { useState, useEffect } from "react";
import { useKeywordResearch } from "./hooks/useKeywordResearch";
import { Toast, ToastItem } from "./components/Toast";
import { ThemeToggle } from "./components/ThemeToggle";
import { KeywordTable } from "./components/KeywordTable";
import {
  exportToCSV,
  exportToExcel,
  exportToTXT,
  copyToClipboard,
} from "./utils/export";
import {
  Play,
  Pause,
  Square,
  Sparkles,
  Database,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Clock,
  Loader2,
  Activity,
  Layers,
  ChevronRight,
  Sliders,
} from "lucide-react";

export default function App() {
  const {
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
  } = useKeywordResearch();

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [inputVal, setInputVal] = useState("");

  // Sync toasts state with useKeywordResearch events
  useEffect(() => {
    setToastHandler((message, type) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
    });
  }, [setToastHandler]);

  const handleCloseToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startResearch(inputVal);
  };

  // Pre-fill input sample helper
  const handleUseExample = () => {
    setInputVal("Jasa Terapi Bekam");
  };

  // Calculations for display
  const isIdle = progress.status === "idle";
  const isRunning = progress.status === "running";
  const isPaused = progress.status === "paused";
  const isStopped = progress.status === "stopped";
  const isCompleted = progress.status === "completed";

  const percent = progress.totalRequests > 0 
    ? Math.round((progress.completedRequests / progress.totalRequests) * 100) 
    : 0;

  // Estimated remaining time based on remaining tasks and active workers
  const remainingTasks = progress.totalRequests - progress.completedRequests;
  const estimatedSecondsLeft = isRunning && remainingTasks > 0
    ? Math.ceil((remainingTasks * settings.delay) / settings.concurrent / 1000)
    : 0;

  // Handles export functions
  const handleCopyAll = async () => {
    if (finalKeywords.length === 0) return;
    const text = finalKeywords.join("\n");
    const success = await copyToClipboard(text);
    if (success) {
      triggerToast("Copied All Keywords Successfully", "success");
    } else {
      triggerToast("Failed to copy to clipboard", "error");
    }
  };

  const handleDownloadTXT = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToTXT(finalKeywords, `google_suggest_${cleanName}.txt`);
    triggerToast("Download Completed (TXT)", "success");
  };

  const handleDownloadCSV = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToCSV(finalKeywords, `google_suggest_${cleanName}.csv`);
    triggerToast("Download Completed (CSV)", "success");
  };

  const handleDownloadExcel = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToExcel(finalKeywords, `google_suggest_${cleanName}.xlsx`);
    triggerToast("Download Completed (Excel)", "success");
  };

  return (
    <div className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 min-h-screen transition-colors duration-300 font-sans flex flex-col justify-between">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={handleCloseToast} />

      {/* Main Layout Wrap */}
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col gap-8">
        {/* Header Block */}
        <header id="app-header" className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-gray-200/60 dark:border-gray-800/60 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1.5">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest font-display">
                SEO Tools Suite
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
              Google Suggest Keyword Research Tool
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Discover Google Autocomplete Keywords Automatically
            </p>
          </div>
          <ThemeToggle />
        </header>

        {/* Input & Configurations Panel */}
        <section id="control-panel" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs p-6 flex flex-col gap-6">
          <form onSubmit={handleStart} className="flex flex-col gap-1.5">
            <label htmlFor="keyword-input" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Target Base Keyword
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="keyword-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Masukkan keyword..."
                  disabled={isRunning || isPaused}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all duration-200 disabled:opacity-60"
                />
              </div>

              {/* Toggle Buttons: Start/Pause/Resume/Stop */}
              <div className="flex gap-2">
                {isIdle || isStopped || isCompleted ? (
                  <button
                    id="btn-start"
                    type="submit"
                    disabled={inputVal.trim().length < 2}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Research
                  </button>
                ) : (
                  <div className="flex gap-2 w-full sm:w-auto">
                    {isRunning ? (
                      <button
                        id="btn-pause"
                        type="button"
                        onClick={pauseResearch}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                      >
                        <Pause className="w-4 h-4 fill-current" />
                        Pause
                      </button>
                    ) : (
                      <button
                        id="btn-resume"
                        type="button"
                        onClick={resumeResearch}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Resume
                      </button>
                    )}
                    <button
                      id="btn-stop"
                      type="button"
                      onClick={stopResearch}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Stop
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Input helpers / Example tip */}
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-gray-500">
                Min 2 chars, Max 150 chars. Auto trims whitespaces.
              </span>
              <button
                id="btn-use-example"
                type="button"
                onClick={handleUseExample}
                disabled={isRunning || isPaused}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium cursor-pointer disabled:opacity-40"
              >
                Contoh: Jasa Terapi Bekam
              </button>
            </div>
          </form>

          {/* Settings Section */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Advanced Configurations
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Delay Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="setting-delay" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Delay Interval
                </label>
                <select
                  id="setting-delay"
                  value={settings.delay}
                  disabled={isRunning || isPaused}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, delay: Number(e.target.value) }))
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-60"
                >
                  <option value={100}>100 ms (Fast)</option>
                  <option value={300}>300 ms (Default)</option>
                  <option value={500}>500 ms (Balanced)</option>
                  <option value={1000}>1000 ms (Stable)</option>
                </select>
                <span className="text-[10px] text-gray-400">Jeda antar request Google</span>
              </div>

              {/* Retry Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="setting-retry" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Retry Limit
                </label>
                <select
                  id="setting-retry"
                  value={settings.retry}
                  disabled={isRunning || isPaused}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, retry: Number(e.target.value) }))
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-60"
                >
                  <option value={0}>0 (No Retry)</option>
                  <option value={1}>1 Retry</option>
                  <option value={2}>2 Retries (Default)</option>
                  <option value={3}>3 Retries</option>
                </select>
                <span className="text-[10px] text-gray-400">Lakukan percobaan ulang saat gagal</span>
              </div>

              {/* Concurrency Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="setting-concurrent" className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Concurrent Requests
                </label>
                <select
                  id="setting-concurrent"
                  value={settings.concurrent}
                  disabled={isRunning || isPaused}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, concurrent: Number(e.target.value) }))
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm text-gray-700 dark:text-gray-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-60"
                >
                  <option value={1}>1 Worker (Slowest)</option>
                  <option value={3}>3 Workers (Default)</option>
                  <option value={5}>5 Workers (Fast)</option>
                  <option value={10}>10 Workers (Super Fast)</option>
                </select>
                <span className="text-[10px] text-gray-400">Jumlah pekerja simultan</span>
              </div>
            </div>
          </div>
        </section>

        {/* Real-time Progress Monitoring bar */}
        {!isIdle && (
          <section id="progress-container" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : isPaused ? (
                  <Pause className="w-4 h-4 text-amber-500" />
                ) : isStopped ? (
                  <XIcon className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {isRunning ? "Scanning Google Suggestions..." : ""}
                  {isPaused ? "Scanning Paused" : ""}
                  {isStopped ? "Scanning Stopped" : ""}
                  {isCompleted ? "Scanning Completed" : ""}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                {progress.completedRequests} / {progress.totalRequests} Requests
              </span>
            </div>

            {/* Progress Bar visualizer */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isRunning
                    ? "bg-blue-600"
                    : isPaused
                    ? "bg-amber-500"
                    : isStopped
                    ? "bg-rose-500"
                    : "bg-emerald-600"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-xs text-gray-500">
              <div className="flex items-center gap-1.5 max-w-full">
                {progress.currentKeyword && isRunning && (
                  <>
                    <Activity className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 animate-pulse" />
                    <span className="truncate">
                      Querying: <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">"{progress.currentKeyword}"</span>
                    </span>
                  </>
                )}
              </div>
              
              {/* Estimated Remaining Time indicator */}
              {isRunning && estimatedSecondsLeft > 0 && (
                <div className="flex items-center gap-1 text-gray-400 flex-shrink-0 font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Est: ~{estimatedSecondsLeft}s left</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Real-time statistics Grid */}
        <section id="stats-container" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Keyword Ditemukan */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Total Found
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                {stats.totalFound}
              </h4>
            </div>
          </div>

          {/* Card 2: Duplicate Dihapus */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Duplicates Removed
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                {stats.duplicatesRemoved}
              </h4>
            </div>
          </div>

          {/* Card 3: Keyword Akhir */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Final Keywords
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 dark:text-white mt-0.5">
                {stats.finalCount}
              </h4>
            </div>
          </div>
        </section>

        {/* Result Table or Empty state Section */}
        <section id="results-panel">
          {finalKeywords.length > 0 ? (
            <KeywordTable
              keywords={finalKeywords}
              onCopyAll={handleCopyAll}
              onDownloadTXT={handleDownloadTXT}
              onDownloadCSV={handleDownloadCSV}
              onDownloadExcel={handleDownloadExcel}
              sortDirection={sortDirection}
              onSortChange={setSortDirection}
            />
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-2">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-display">
                  Belum ada data.
                </h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 max-w-sm mx-auto mt-1">
                  Masukkan kata kunci target Anda di atas dan klik "Start Research" untuk memulai proses scanning.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-left max-w-sm border border-gray-100 dark:border-gray-800 rounded-xl p-3 bg-gray-50/50 dark:bg-gray-950 text-gray-500 mt-2">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Bagaimana cara kerjanya?</span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Sistem akan memindai suffix otomatis (dari "keyword a" s/d "keyword z")
                </span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Sistem akan memindai prefix otomatis (dari "a keyword" s/d "z keyword")
                </span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Total 52 request Google Autocomplete digabung & diurutkan otomatis!
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Block */}
      <footer id="app-footer" className="w-full border-t border-gray-200/60 dark:border-gray-800/60 py-6 mt-12 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>
            &copy; {new Date().getFullYear()} Google Suggest Keyword Research Tool. All rights reserved.
          </span>
          <div className="flex gap-4 font-medium text-gray-400 dark:text-gray-500">
            <span>Powered by Google Chrome Autocomplete Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Custom icons
const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
