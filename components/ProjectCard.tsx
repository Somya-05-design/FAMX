"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ProjectStatus, TimelineTier } from "@prisma/client";
import { useRouter } from "next/navigation";

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

interface ProjectCardProps {
  project: Project;
  hasUnreadMessage: boolean;
}

export function ProjectCard({ project, hasUnreadMessage }: ProjectCardProps) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : undefined,
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // If it's a drag event, don't navigate
    const isDrag = e.defaultPrevented;
    if (isDrag) return;

    // Navigate to the detail page
    router.push(`/admin/projects/${project.id}`);
  };

  // Format Timeline Tier
  const formatTimeline = (tier: TimelineTier) => {
    switch (tier) {
      case "INSTANT":
        return "Instant / Rush";
      case "WITHIN_WEEK":
        return "Within a Week";
      case "WITHIN_MONTH":
        return "Within a Month";
      case "CUSTOM_DATE":
        return "Custom Date";
      default:
        return tier;
    }
  };

  // Format Last Updated
  const formatLastUpdated = (dateVal: Date | string) => {
    const date = new Date(dateVal);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 600);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative p-4 bg-zinc-900/40 hover:bg-zinc-900/60 border ${
        hasUnreadMessage ? "border-violet-500/40 hover:border-violet-500/60" : "border-zinc-800/80 hover:border-zinc-700/80"
      } rounded-xl shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-black/20 flex flex-col space-y-3 select-none`}
    >
      {/* Service type & Unread indicator */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-zinc-950 border border-zinc-800 text-zinc-400 max-w-[80%] truncate">
          {project.service?.name || project.customServiceText || "Custom"}
        </span>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Unread message indicator */}
          {hasUnreadMessage && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
            </span>
          )}
        </div>
      </div>

      {/* Title & Client Name */}
      <div>
        <h4 className="text-xs font-bold text-zinc-100 group-hover:text-violet-400 transition-colors line-clamp-1">
          {project.title}
        </h4>
        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
          Client: <span className="text-zinc-300 font-medium">{project.client.name || "Client"}</span>
        </p>
      </div>

      {/* Financials & Timeline Tier */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900/60 text-[10px]">
        <div>
          <p className="text-zinc-500 font-medium">
            {project.quoteAmount ? "Final Quote" : "Proposed Budget"}
          </p>
          <p className={`font-bold mt-0.5 ${project.quoteAmount ? "text-violet-400" : "text-zinc-300"}`}>
            ${(project.quoteAmount || project.proposedBudget).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
        <div>
          <p className="text-zinc-500 font-medium">Timeline</p>
          <p className="text-zinc-300 font-semibold mt-0.5 truncate">
            {formatTimeline(project.timelineTier as TimelineTier)}
          </p>
        </div>
      </div>

      {/* Footer: Date & Badges */}
      <div className="flex items-center justify-between pt-1 text-[9px] text-zinc-500">
        <span>Updated {formatLastUpdated(project.updatedAt)}</span>

        <div className="flex items-center space-x-1 shrink-0">
          {/* Disputed Badge (Completed column only) */}
          {project.status === "COMPLETED" && project.isDisputed && (
            <span className="px-1.5 py-0.5 rounded bg-rose-950/50 border border-rose-900/40 text-rose-400 font-extrabold tracking-wider uppercase">
              Disputed 🚩
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
