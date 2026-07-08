import React, { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Search,
  Copy,
  FileText,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ListFilter,
} from "lucide-react";

interface KeywordTableProps {
  keywords: string[];
  onCopyAll: () => void;
  onDownloadTXT: () => void;
  onDownloadCSV: () => void;
  onDownloadExcel: () => void;
  sortDirection: "A-Z" | "Z-A";
  onSortChange: (dir: "A-Z" | "Z-A") => void;
}

interface TableRowData {
  index: number;
  keyword: string;
}

export const KeywordTable: React.FC<KeywordTableProps> = ({
  keywords,
  onCopyAll,
  onDownloadTXT,
  onDownloadCSV,
  onDownloadExcel,
  sortDirection,
  onSortChange,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);

  // Transform raw keywords array to array of objects for the table
  const tableData = useMemo(() => {
    return keywords.map((keyword, index) => ({
      index: index + 1,
      keyword,
    }));
  }, [keywords]);

  // Define columns
  const columns = useMemo<ColumnDef<TableRowData>[]>(
    () => [
      {
        header: "No",
        accessorKey: "index",
        cell: (info) => (
          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
            {info.row.index + 1 + info.table.getState().pagination.pageIndex * info.table.getState().pagination.pageSize}
          </span>
        ),
        size: 80,
      },
      {
        header: "Keyword",
        accessorKey: "keyword",
        cell: (info) => (
          <span className="select-all font-medium text-gray-800 dark:text-gray-200 break-all">
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  // Initialize TanStack table
  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
        pageIndex: 0,
      },
    },
  });

  // Update page size
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = Number(e.target.value);
    setPageSize(size);
    table.setPageSize(size);
  };

  const filteredCount = table.getFilteredRowModel().rows.length;

  return (
    <div id="result-section" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="search-box"
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-gray-100 transition-all duration-200"
          />
        </div>

        {/* Action Buttons & Sort & Export */}
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {/* Sorting Control */}
          <div className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 bg-white dark:bg-gray-950 text-sm">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              id="sort-select"
              value={sortDirection}
              onChange={(e) => onSortChange(e.target.value as "A-Z" | "Z-A")}
              className="bg-transparent font-medium text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer text-xs"
            >
              <option value="A-Z">A-Z (Alphabetical)</option>
              <option value="Z-A">Z-A (Reverse)</option>
            </select>
          </div>

          {/* Copy Button */}
          <button
            id="btn-copy-all"
            disabled={keywords.length === 0}
            onClick={onCopyAll}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-gray-950 transition-all duration-200 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy All
          </button>

          {/* Download Dropdown or Buttons */}
          <div className="flex items-center gap-1">
            <button
              id="btn-download-txt"
              disabled={keywords.length === 0}
              onClick={onDownloadTXT}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              title="Download TXT"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">TXT</span>
            </button>
            <button
              id="btn-download-csv"
              disabled={keywords.length === 0}
              onClick={onDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-50 transition-all duration-200 cursor-pointer"
              title="Download CSV"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button
              id="btn-download-xlsx"
              disabled={keywords.length === 0}
              onClick={onDownloadExcel}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 border border-blue-600 rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 dark:disabled:bg-gray-950 dark:disabled:border-gray-900 transition-all duration-200 cursor-pointer"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table id="keywords-data-table" className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-50/70 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-950/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="p-4 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                  No matching keywords found. Try searching for something else.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination */}
      {table.getPageCount() > 1 && (
        <div className="p-4 bg-gray-50/35 dark:bg-gray-950/10 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-4 items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={handlePageSizeChange}
              className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1 text-xs focus:outline-hidden"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
            <span className="mx-2 text-gray-300 dark:text-gray-700">|</span>
            <span>
              Showing {table.getState().pagination.pageIndex * pageSize + 1} to{" "}
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * pageSize,
                filteredCount
              )}{" "}
              of {filteredCount} keywords
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="btn-prev-page"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-medium text-xs">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>
            <button
              id="btn-next-page"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-850 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
