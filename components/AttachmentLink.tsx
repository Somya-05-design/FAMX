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
    ? "flex items-center justify-between p-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl hover:border-primary shadow-xs transition-all text-xs text-left w-full group cursor-pointer disabled:opacity-50"
    : "flex items-center justify-between p-3.5 bg-surface-container-high border border-outline-variant rounded-xl hover:border-primary transition-colors text-xs text-left w-full group cursor-pointer disabled:opacity-50";

  const iconBoxClasses = variant === "light"
    ? "p-2 bg-surface-container-low rounded-lg text-outline group-hover:text-primary group-hover:bg-inverse-primary/20 transition-all shrink-0"
    : "p-2 bg-surface-container-highest rounded-lg text-on-surface-variant group-hover:text-primary group-hover:bg-inverse-primary/20 transition-all shrink-0";

  const fileNameClasses = variant === "light"
    ? "text-on-surface font-bold truncate group-hover:text-primary transition-colors"
    : "text-on-surface font-semibold truncate group-hover:text-primary transition-colors";

  const subtextClasses = variant === "light"
    ? "text-[10px] text-on-surface-variant mt-0.5"
    : "text-[10px] text-on-surface-variant mt-0.5";

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className={containerClasses}
    >
      <div className="flex items-center space-x-3 truncate">
        <div className={iconBoxClasses}>
          {isDownloading ? (
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin block" />
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
      <div className="text-outline group-hover:text-primary pl-4 shrink-0 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </button>
  );
}
