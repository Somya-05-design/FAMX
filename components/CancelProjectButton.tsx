"use client";

import { useState } from "react";
import { ProjectStatus } from "@prisma/client";
import { updateProjectStatusAction } from "@/app/actions/projects";

interface CancelProjectButtonProps {
  projectId: string;
  status: ProjectStatus;
}

export function CancelProjectButton({ projectId, status }: CancelProjectButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const isCancellable = status === ProjectStatus.SUBMITTED || status === ProjectStatus.QUOTED;

  if (!isCancellable) return null;

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this project? This action is permanent.")) {
      return;
    }

    setIsPending(true);
    try {
      await updateProjectStatusAction(projectId, ProjectStatus.CANCELLED);
    } catch (err: any) {
      alert(err.message || "Failed to cancel project");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 hover:border-rose-700/60 text-rose-400 font-semibold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
    >
      {isPending ? (
        <span className="w-4 h-4 border-2 border-rose-400/30 border-t-rose-400 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
      <span>Cancel Project</span>
    </button>
  );
}
