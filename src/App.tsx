import React, { useState, useEffect } from "react";
import { useKeywordResearch } from "./hooks/useKeywordResearch";
import { Toast, ToastItem } from "./components/Toast";
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
  Clock,
  Loader2,
  Activity,
  Layers,
  ChevronRight,
  X,
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
      triggerToast("Semua Kata Kunci Berhasil Disalin", "success");
    } else {
      triggerToast("Gagal menyalin ke papan klip", "error");
    }
  };

  const handleDownloadTXT = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToTXT(finalKeywords, `google_suggest_${cleanName}.txt`);
    triggerToast("Unduhan Selesai (TXT)", "success");
  };

  const handleDownloadCSV = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToCSV(finalKeywords, `google_suggest_${cleanName}.csv`);
    triggerToast("Unduhan Selesai (CSV)", "success");
  };

  const handleDownloadExcel = () => {
    if (finalKeywords.length === 0) return;
    const cleanName = keyword.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    exportToExcel(finalKeywords, `google_suggest_${cleanName}.xlsx`);
    triggerToast("Unduhan Selesai (Excel)", "success");
  };

  // Selalu hapus kelas .dark dari documentElement agar tetap dalam Mode Terang (Light Mode)
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }, []);

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen font-sans flex flex-col justify-between">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onClose={handleCloseToast} />

      {/* Main Layout Wrap */}
      <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex-1 flex flex-col gap-8">
        {/* Header Block */}
        <header id="app-header" className="flex flex-col gap-3 justify-center items-center border-b border-gray-200/60 pb-6 text-center">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 text-blue-600 mb-1.5">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest font-display">
                Paket Alat SEO
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-display">
              Alat Riset Kata Kunci Google Suggest
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Temukan Rekomendasi Kata Kunci Autocomplete Google Secara Otomatis
            </p>
          </div>
        </header>

        {/* Input & Configurations Panel */}
        <section id="control-panel" className="bg-white border border-gray-200 rounded-2xl shadow-xs p-6 flex flex-col gap-6">
          <form onSubmit={handleStart} className="flex flex-col gap-1.5">
            <label htmlFor="keyword-input" className="text-sm font-semibold text-gray-700">
              Kata Kunci Utama Target
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  id="keyword-input"
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Masukkan kata kunci..."
                  disabled={isRunning || isPaused}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 disabled:opacity-60"
                />
              </div>

              {/* Toggle Buttons: Start/Pause/Resume/Stop */}
              <div className="flex gap-2">
                {isIdle || isStopped || isCompleted ? (
                  <button
                    id="btn-start"
                    type="submit"
                    disabled={inputVal.trim().length < 2}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Mulai Riset
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
                        Jeda
                      </button>
                    ) : (
                      <button
                        id="btn-resume"
                        type="button"
                        onClick={resumeResearch}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        Lanjutkan
                      </button>
                    )}
                    <button
                      id="btn-stop"
                      type="button"
                      onClick={stopResearch}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Hentikan
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Input helpers / Example tip */}
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-gray-500">
                Minimal 2 karakter, Maksimal 150 karakter. Spasi otomatis dibersihkan.
              </span>
              <button
                id="btn-use-example"
                type="button"
                onClick={handleUseExample}
                disabled={isRunning || isPaused}
                className="text-blue-600 hover:underline font-medium cursor-pointer disabled:opacity-40"
              >
                Contoh: Jasa Terapi Bekam
              </button>
            </div>
          </form>
        </section>

        {/* Real-time Progress Monitoring bar */}
        {!isIdle && (
          <section id="progress-container" className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {isRunning ? (
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                ) : isPaused ? (
                  <Pause className="w-4 h-4 text-amber-500" />
                ) : isStopped ? (
                  <X className="w-4 h-4 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
                <span className="font-semibold text-gray-700">
                  {isRunning ? "Sedang Memindai Saran Google..." : ""}
                  {isPaused ? "Pemindaian Dijeda" : ""}
                  {isStopped ? "Pemindaian Dihentikan" : ""}
                  {isCompleted ? "Pemindaian Selesai" : ""}
                </span>
              </div>
              <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                {progress.completedRequests} / {progress.totalRequests} Permintaan
              </span>
            </div>

            {/* Progress Bar visualizer */}
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
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
                      Meminta: <span className="font-semibold text-gray-700 font-mono">"{progress.currentKeyword}"</span>
                    </span>
                  </>
                )}
              </div>
              
              {/* Estimated Remaining Time indicator */}
              {isRunning && estimatedSecondsLeft > 0 && (
                <div className="flex items-center gap-1 text-gray-400 flex-shrink-0 font-medium">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>Estimasi: ~{estimatedSecondsLeft} dtk tersisa</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Real-time statistics Grid */}
        <section id="stats-container" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Total Keyword Ditemukan */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                TOTAL DITEMUKAN
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
                {stats.totalFound}
              </h4>
            </div>
          </div>

          {/* Card 2: Duplicate Dihapus */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                DUPLIKAT DIHAPUS
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
                {stats.duplicatesRemoved}
              </h4>
            </div>
          </div>

          {/* Card 3: Keyword Akhir */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all hover:scale-[1.01]">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                KATA KUNCI AKHIR
              </p>
              <h4 className="text-2xl font-bold font-mono text-gray-900 mt-0.5">
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
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-2">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 font-display">
                  Belum ada data.
                </h3>
                <p className="text-sm text-gray-400 max-w-sm mx-auto mt-1">
                  Masukkan kata kunci target Anda di atas dan klik "Mulai Riset" untuk memulai proses pemindaian.
                </p>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-left max-w-sm border border-gray-100 rounded-xl p-3 bg-gray-50/50 text-gray-500 mt-2">
                <span className="font-semibold text-gray-700">Bagaimana cara kerjanya?</span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Sistem akan memindai akhiran (suffix) otomatis (dari "kata kunci a" s/d "kata kunci z")
                </span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Sistem akan memindai awalan (prefix) otomatis (dari "a kata kunci" s/d "z kata kunci")
                </span>
                <span className="flex items-start gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  Total 52 permintaan Google Autocomplete digabung & diurutkan otomatis!
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer Block */}
      <footer id="app-footer" className="w-full border-t border-gray-200/60 py-6 mt-12 bg-white/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <span>
            &copy; {new Date().getFullYear()} Alat Riset Kata Kunci Google Suggest. Hak Cipta Dilindungi Undang-Undang.
          </span>
          <div className="flex gap-4 font-medium text-gray-400">
            <span>Ditenagai oleh Mesin Autocomplete Google Chrome</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
