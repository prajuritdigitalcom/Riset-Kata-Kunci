import * as XLSX from "xlsx";

/**
 * Utility to delay execution for a given number of milliseconds
 */
export const delayHelper = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Remove duplicate strings from an array, as well as trimming empty entries
 */
export const removeDuplicates = (keywords: string[]): string[] => {
  const cleanKeywords = keywords
    .map((kw) => kw.replace(/\s+/g, " ").trim())
    .filter((kw) => kw.length > 0);
  return Array.from(new Set(cleanKeywords));
};

/**
 * Sort strings from A to Z
 */
export const sortAZ = (keywords: string[]): string[] => {
  return [...keywords].sort((a, b) => a.localeCompare(b));
};

/**
 * Sort strings from Z to A
 */
export const sortZA = (keywords: string[]): string[] => {
  return [...keywords].sort((a, b) => b.localeCompare(a));
};

/**
 * Copies plain text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error("Failed to copy text: ", err);
    return false;
  }
};

/**
 * Export keyword list to TXT format
 */
export const exportToTXT = (keywords: string[], fileName: string = "keyword_suggestions.txt") => {
  const content = keywords.join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export keyword list to CSV format
 */
export const exportToCSV = (keywords: string[], fileName: string = "keyword_suggestions.csv") => {
  // Format as clean CSV with headers
  const csvContent = "No,Keyword\n" + keywords.map((kw, idx) => `${idx + 1},"${kw.replace(/"/g, '""')}"`).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export keyword list to Excel (.xlsx) format using xlsx library
 */
export const exportToExcel = (keywords: string[], fileName: string = "keyword_suggestions.xlsx") => {
  const data = keywords.map((kw, idx) => ({
    "No": idx + 1,
    "Keyword": kw
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Keyword Suggestions");
  
  // Generate buffer and trigger download
  XLSX.writeFile(workbook, fileName);
};
