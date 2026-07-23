"use client";

import { useDroppable } from "@dnd-kit/core";
import { ProjectCard } from "./ProjectCard";
import { ProjectStatus } from "@prisma/client";

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  proposedBudget: number;
  quoteAmount: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  service: { name: string } | null;
  customServiceText: string | null;
  client: { name: string | null; email: string };
  isDisputed: boolean;
}

interface Notification {
  id: string;
  type: string;
  projectId: string | null;
  read: boolean;
}

interface KanbanColumnProps {
  id: ProjectStatus;
  title: string;
  projects: Project[];
  notifications: Notification[];
}

export function KanbanColumn({ id, title, projects, notifications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  // Check if a project has unread messages
  const checkUnread = (projectId: string) => {
    return notifications.some(
      (n) => !n.read && n.type === "NEW_MESSAGE" && n.projectId === projectId
    );
  };

  const getColumnIcon = () => {
    switch (id) {
      case "SUBMITTED":
        return (
          <svg className="w-4 h-4 text-outline shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      case "QUOTED":
        return (
          <svg className="w-4 h-4 text-primary shrink-0 animate-spin-slow" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
        );
      case "IN_PROGRESS":
        return (
          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "COMPLETED":
        return (
          <svg className="w-4 h-4 text-on-surface-variant shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 3" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] max-w-[350px] bg-surface-container-low border ${
        isOver
          ? "border-primary bg-surface-container-high shadow-xs"
          : "border-outline-variant"
      } rounded-2xl p-4 transition-all duration-200 h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/60 shrink-0 select-none">
        <div className="flex items-center space-x-2.5">
          {getColumnIcon()}
          <h3 className="text-sm font-bold text-on-surface tracking-tight">{title}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-extrabold shrink-0">
            {projects.length}
          </span>
        </div>

        {/* Plus Button no-op affordance */}
        <button
          className="w-5 h-5 rounded-full bg-surface-container-high text-outline flex items-center justify-center text-xs font-bold transition-colors cursor-not-allowed opacity-60"
          title="Manual addition disabled"
          disabled
        >
          +
        </button>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-outline-variant scrollbar-track-transparent">
        {projects.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-dashed border-outline-variant rounded-2xl p-6 text-center select-none">
            <p className="text-[10px] text-outline font-semibold uppercase tracking-wider">
              Drop projects here
            </p>
          </div>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              hasUnreadMessage={checkUnread(project.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
