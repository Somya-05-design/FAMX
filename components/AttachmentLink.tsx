"use client";

import { useState } from "react";
import { getDownloadUrl } from "@/app/actions/attachments";

interface AttachmentLinkProps {
  id: string;
  fileName: string;
  sizeBytes: number;
}

export function AttachmentLink({ id, fileName, sizeBytes }: AttachmentLinkProps) {
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

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center justify-between p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors text-xs text-left w-full group cursor-pointer disabled:opacity-50"
    >
      <div className="flex items-center space-x-3 truncate">
        <div className="p-2 bg-zinc-850 rounded-lg text-zinc-400 group-hover:text-violet-400 group-hover:bg-zinc-800 transition-all shrink-0">
          {isDownloading ? (
            <span className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin block" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>
        <div className="truncate">
          <p className="text-zinc-300 font-semibold truncate group-hover:text-zinc-200 transition-colors">
            {fileName}
          </p>
          <p className="text-[10px] text-zinc-500 mt-0.5">
            {(sizeBytes / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
      <div className="text-zinc-500 group-hover:text-zinc-300 pl-4 shrink-0 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      </div>
    </button>
  );
}
