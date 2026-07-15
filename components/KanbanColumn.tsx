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

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col flex-1 min-w-[280px] max-w-[350px] bg-zinc-900/10 border ${
        isOver ? "border-violet-500/50 bg-zinc-900/30 shadow-lg shadow-violet-950/5" : "border-zinc-900/60"
      } rounded-2xl p-4 transition-all duration-200 h-[calc(100vh-12rem)] min-h-[500px] overflow-hidden`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-900">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              id === "SUBMITTED"
                ? "bg-amber-500"
                : id === "QUOTED"
                ? "bg-violet-500"
                : id === "IN_PROGRESS"
                ? "bg-blue-500"
                : "bg-emerald-500"
            }`}
          />
          <h3 className="text-sm font-bold text-zinc-200 tracking-wide">{title}</h3>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-extrabold">
          {projects.length}
        </span>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
        {projects.length === 0 ? (
          <div className="h-full flex items-center justify-center border border-dashed border-zinc-900 rounded-xl p-6 text-center">
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
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
