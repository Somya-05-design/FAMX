"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions/attachments";

interface AttachmentLinkProps {
  id: string;
  fileName: string;
  sizeBytes: number;
  variant?: "dark" | "light";
}

export function AttachmentLink({ id, fileName, sizeBytes, variant = "light" }: AttachmentLinkProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const url = await getDownloadUrl(id);
      window.open(url, "_blank");
    } catch (err: any) {
      alert(err.message || "Failed to download attachment");
    } finally {
      setIsDownloading(false);
    }
  };

  const containerClasses = variant === "light"
    ? "flex items-center justify-between p-3.5 bg-white border border-zinc-200/80 rounded-xl hover:border-zinc-300 shadow-sm transition-all text-xs text-left w-full group cursor-pointer disabled:opacity-50"
    : "flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-xs text-left w-full group cursor-pointer disabled:opacity-50";

  const iconBoxClasses = variant === "light"
    ? "p-2 bg-zinc-100 rounded-lg text-zinc-500 group-hover:text-purple-600 group-hover:bg-purple-50 transition-all shrink-0"
    : "p-2 bg-zinc-850 rounded-lg text-zinc-400 group-hover:text-violet-400 group-hover:bg-zinc-800 transition-all shrink-0";

  const fileNameClasses = variant === "light"
    ? "text-zinc-800 font-bold truncate group-hover:text-purple-600 transition-colors"
    : "text-zinc-300 font-semibold truncate group-hover:text-zinc-200 transition-colors";

  const subtextClasses = variant === "light"
    ? "text-[10px] text-zinc-400 mt-0.5"
    : "text-[10px] text-zinc-500 mt-0.5";

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={containerClasses}
    >
      <div className="flex items-center space-x-3 truncate">
        <div className={iconBoxClasses}>
          {isDownloading ? (
            <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin block" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        <div className="truncate">
          <p className={fileNameClasses}>
            {fileName}
          </p>
          <p className={subtextClasses}>
            {(sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
      <div className="text-zinc-400 group-hover:text-purple-600 pl-4 shrink-0 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </button>
  );
}
