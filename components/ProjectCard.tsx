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
  attachmentCount?: number;
  messageCount?: number;
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
    const isDrag = e.defaultPrevented;
    if (isDrag) return;
    router.push(`/admin/projects/${project.id}`);
  };

  // Format Date to match "12 Nov" style
  const formatDateMock = (dateVal: Date | string) => {
    const date = new Date(dateVal);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  // Map enum status to progress percentage mockup values per Section 2 & 3
  const getProgressDetails = (status: ProjectStatus) => {
    switch (status) {
      case "SUBMITTED":
        return { percent: "25%", color: "text-on-tertiary bg-tertiary", dot: "bg-on-tertiary" };
      case "QUOTED":
        return { percent: "50%", color: "text-on-secondary-container bg-secondary-container", dot: "bg-on-secondary-container" };
      case "IN_PROGRESS":
        return { percent: "80%", color: "text-primary bg-inverse-primary font-black", dot: "bg-primary" };
      case "COMPLETED":
        return { percent: "100%", color: "text-on-primary bg-primary", dot: "bg-on-primary" };
      default:
        return { percent: "0%", color: "text-on-surface-variant bg-surface-container-high", dot: "bg-outline" };
    }
  };

  const progress = getProgressDetails(project.status);

  // Get initials for Client Avatar
  const clientName = project.client.name || project.client.email || "C";
  const initials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`group relative p-5 bg-surface-container-lowest border border-outline-variant hover:border-primary rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing flex flex-col space-y-4 select-none`}
    >
      {/* Category Pill Tag at top left */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold bg-surface-container-low text-on-surface-variant border border-outline-variant/60 max-w-[70%] truncate">
          {project.service?.name || project.customServiceText || "Custom"}
        </span>

        {/* Dispute alert indicator */}
        {project.status === "COMPLETED" && project.isDisputed && (
          <span className="text-[9px] font-bold text-on-error bg-error px-1.5 py-0.5 rounded-md shrink-0">
            Disputed 🚩
          </span>
        )}
      </div>

      {/* Card Title & Description snippet */}
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
          {project.title}
        </h4>
        <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
          {project.description}
        </p>
      </div>

      {/* Date & Progress Indicator Row */}
      <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant pt-1">
        {/* Calendar & Date */}
        <div className="flex items-center space-x-1.5">
          <svg className="w-3.5 h-3.5 text-outline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-[11px] text-on-surface-variant">{formatDateMock(project.updatedAt)}</span>
        </div>

        {/* Progress Percentage Badge */}
        <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${progress.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${progress.dot}`} />
          <span>{progress.percent}</span>
        </div>
      </div>

      {/* Footer Divider */}
      <div className="h-px bg-outline-variant/30" />

      {/* Card Footer Row: User avatar & counts */}
      <div className="flex items-center justify-between shrink-0">
        {/* Client avatar */}
        <div
          className={`w-7 h-7 rounded-full bg-primary flex items-center justify-center text-on-primary text-[9px] font-black shadow-xs`}
          title={`Client: ${clientName}`}
        >
          {initials}
        </div>

        {/* Link and Chat counts */}
        <div className="flex items-center space-x-3 text-outline">
          {/* Attachment count */}
          <div className="flex items-center space-x-1 text-[11px] font-semibold" title={`${project.attachmentCount || 0} Attachments`}>
            <svg className="w-3.5 h-3.5 rotate-45 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 0l-3.536 3.536m3.536-3.536L14.828 12M15 15.012l-1.352-1.353m0 0L8.636 18.364a9 9 0 1112.728-12.728L18.363 9" />
            </svg>
            <span>{project.attachmentCount || 0}</span>
          </div>

          {/* Message count */}
          <div className="flex items-center space-x-1 text-[11px] font-semibold relative" title={`${project.messageCount || 0} Messages`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.678 20.89a8.042 8.042 0 005.105-.347m0 0a8.04 8.04 0 003.582-2.923m-3.582 2.923a9.06 9.06 0 01-3.097.35m7.903-5.73a9.002 9.002 0 01-1.121 3.47m0 0a8.04 8.04 0 01-3.698 2.614m-5.187-5.064A9.005 9.005 0 017 12c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 9-9 9a8.96 8.96 0 01-4.188-1.022l-4.57 1.22 1.22-4.57z" />
            </svg>
            <span>{project.messageCount || 0}</span>

            {/* Glowing dot if unread message */}
            {hasUnreadMessage && (
              <span className="absolute -top-0.5 -right-1 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-error"></span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
