"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { ProjectStatus } from "@prisma/client";
import { KanbanColumn } from "./KanbanColumn";
import { QuoteEntryModal } from "./QuoteEntryModal";
import { updateProjectStatusAction } from "@/app/actions/projects";
import { getNotificationsAction, markAsReadAction, markAllAsReadAction } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

interface Notification {
  id: string;
  type: string;
  projectId: string | null;
  read: boolean;
  createdAt: Date | string;
}

interface KanbanBoardProps {
  initialProjects: Project[];
  initialNotifications: Notification[];
  userId: string;
}

export function KanbanBoard({
  initialProjects,
  initialNotifications,
  userId,
}: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "ALL";
  const viewParam = searchParams.get("view") || "board";

  // Quote Entry Modal state
  const [selectedProjectForQuote, setSelectedProjectForQuote] = useState<Project | null>(null);
  const [targetStatusForQuote, setTargetStatusForQuote] = useState<ProjectStatus | null>(null);

  // Setup sensors for DnD - constraint activation prevents drag on simple click
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Sync projects with initialProjects prop if it changes (e.g. from Server Component)
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Sync notifications with initialNotifications prop
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Subscribing to Notification changes to sync unread message badge
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`admin-kanban-notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${userId}`,
        },
        async () => {
          try {
            const data = await getNotificationsAction();
            setNotifications(data as any);
          } catch (err) {
            console.error("Failed to load notifications in Kanban board", err);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Filter projects by Search and Category
  const filteredProjects = projects.filter((project) => {
    // Search filter
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Service category filter
    if (activeCategory !== "ALL") {
      const categoryName = project.service?.name || project.customServiceText || "Custom";
      if (categoryName !== activeCategory) return false;
    }

    return true;
  });

  // Partition projects into Active and Cancelled
  const activeProjects = filteredProjects.filter((p) => p.status !== "CANCELLED");
  const cancelledProjects = filteredProjects.filter((p) => p.status === "CANCELLED");

  // Columns specification (excluding CANCELLED)
  const columns: { id: ProjectStatus; title: string }[] = [
    { id: "SUBMITTED", title: "Requested" },
    { id: "QUOTED", title: "Quoted" },
    { id: "IN_PROGRESS", title: "In Progress" },
    { id: "COMPLETED", title: "Completed" },
  ];

  // Drag and Drop End Handler
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the project being dragged
    const project = projects.find((p) => p.id === activeId);
    if (!project) return;

    const sourceStatus = project.status;

    // Determine target status
    let destStatus: ProjectStatus | null = null;
    if (["SUBMITTED", "QUOTED", "IN_PROGRESS", "COMPLETED"].includes(overId)) {
      destStatus = overId as ProjectStatus;
    } else {
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) {
        destStatus = overProject.status;
      }
    }

    if (!destStatus || sourceStatus === destStatus) return;

    // Check legality of transition (Client-side UX check)
    const isAdjacentForwardMove =
      (sourceStatus === "SUBMITTED" && destStatus === "QUOTED") ||
      (sourceStatus === "QUOTED" && destStatus === "IN_PROGRESS") ||
      (sourceStatus === "IN_PROGRESS" && destStatus === "COMPLETED");

    if (!isAdjacentForwardMove) {
      alert(`Invalid transition from ${sourceStatus} to ${destStatus}. Drags can only move forward one step (Requested → Quoted → In Progress → Completed).`);
      return;
    }

    // Intercept Submitted -> Quoted to prompt for Quote Amount
    if (sourceStatus === "SUBMITTED" && destStatus === "QUOTED") {
      setSelectedProjectForQuote(project);
      setTargetStatusForQuote(destStatus);
      return;
    }

    // Perform bare status flip (optimistic move)
    await executeStatusTransition(project, destStatus);
  };

  // Helper to execute a status transition with optimistic state updates and rollback
  const executeStatusTransition = async (
    project: Project,
    destStatus: ProjectStatus,
    quoteAmount?: number
  ) => {
    const originalProjects = [...projects];

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? {
            ...p,
            status: destStatus,
            quoteAmount: quoteAmount !== undefined ? quoteAmount : p.quoteAmount,
            updatedAt: new Date().toISOString(),
          }
          : p
      )
    );

    try {
      await updateProjectStatusAction(project.id, destStatus, {
        quoteAmount,
        expectedUpdatedAt: project.updatedAt,
      });
    } catch (err: any) {
      // Rollback on failure
      setProjects(originalProjects);
      alert(err.message || "Failed to update project status. The change was rolled back.");
    }
  };

  const handleQuoteSubmit = async (amount: number) => {
    if (!selectedProjectForQuote || !targetStatusForQuote) return;

    // Trigger mutation & close modal on success
    await executeStatusTransition(selectedProjectForQuote, targetStatusForQuote, amount);

    setSelectedProjectForQuote(null);
    setTargetStatusForQuote(null);
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await markAsReadAction(id);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllAsReadAction();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row: Title & Assignee cluster */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 pb-4 border-b border-outline-variant/60">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-on-surface">
            {viewParam === "notifications" ? "Notifications" : "Dashboard"}
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            {viewParam === "notifications"
              ? "Review activity logs, alerts, and message workspace updates."
              : "Review design briefs, issue quotes, and manage project states."}
          </p>
        </div>

        {/* User avatar stack + Assignee button */}
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary flex items-center justify-center text-on-primary text-[9px] font-black shadow-xs">
              JD
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container flex items-center justify-center text-on-primary text-[9px] font-black shadow-xs">
              ST
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-tertiary flex items-center justify-center text-on-tertiary text-[9px] font-black shadow-xs">
              AL
            </div>
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-on-surface-variant text-[9px] font-bold shadow-xs select-none">
              +8
            </div>
          </div>
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl text-xs font-semibold shadow-xs transition-all cursor-not-allowed opacity-60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span>Add assignee</span>
          </button>
        </div>
      </div>

      {/* Secondary Top Row: View tabs, Search, Filter, Share, and Cancelled-toggle */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-transparent py-2 select-none">
        {/* Right Side: Search, Filter, Share, Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 md:w-80 min-w-[200px]">
            <span className="absolute left-3.5 top-3 text-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface outline-none transition-all shadow-xs"
            />
          </div>

          {/* Filter Dropdown Placeholder */}
          <button className="flex items-center space-x-1.5 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl text-xs font-semibold shadow-xs transition-all cursor-not-allowed opacity-60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filter</span>
          </button>

          {/* Share Button Placeholder */}
          <button className="flex items-center space-x-1.5 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-xl text-xs font-semibold shadow-xs transition-all cursor-not-allowed opacity-60">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-2.012 1.341m2.012-1.341a3.001 3.001 0 11-2.012-3.342m2.012 3.342a3.001 3.001 0 005.38 2.012m-5.38-2.012a3.001 3.001 0 115.38-2.012" />
            </svg>
            <span>Share</span>
          </button>

          {/* Show Cancelled / Cancelled Project Toggle */}
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
              showCancelled
                ? "bg-tertiary border-transparent text-on-tertiary hover:bg-tertiary-container"
                : "bg-primary border-transparent text-on-primary hover:bg-primary-container"
            }`}
          >
            {showCancelled ? "Show Board" : "Cancelled Project"}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewParam === "notifications" ? (
        /* Dynamic Notifications View List */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-xs space-y-6 animate-fadeIn">
          <div className="flex justify-between items-center pb-4 border-b border-outline-variant/60">
            <h2 className="text-lg font-black text-on-surface tracking-tight">System Activity Alerts</h2>
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="py-16 text-center text-outline select-none">
                <svg className="w-12 h-12 mx-auto text-outline/60 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                <p className="text-sm font-bold text-on-surface">All caught up!</p>
                <p className="text-xs text-on-surface-variant mt-1">You have no system activity notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 border rounded-2xl transition-all ${
                    !notification.read
                      ? "bg-inverse-primary/20 border-primary/30 shadow-xs"
                      : "bg-surface-container-lowest border-outline-variant hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start space-x-3.5 min-w-0">
                    {/* Glowing status dot */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        !notification.read
                          ? "bg-primary shadow-xs"
                          : "bg-outline-variant"
                      }`}
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-on-surface">
                        {notification.type === "NEW_MESSAGE" ? "New Project Message" : "Project Status Update"}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed truncate max-w-[280px] sm:max-w-md md:max-w-xl xl:max-w-4xl">
                        {notification.type === "NEW_MESSAGE"
                          ? "A new message was posted in the project workspace by the client."
                          : "A project status state transition occurred."}
                      </p>
                      <span className="text-[10px] text-outline block mt-1.5">
                        {new Date(notification.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                    {notification.projectId && (
                      <Link
                        href={`/admin/projects/${notification.projectId}`}
                        className="px-3.5 py-1.5 border border-outline-variant hover:bg-surface-container-low text-on-surface-variant rounded-xl text-xs font-bold transition-all shadow-xs"
                      >
                        View Workspace
                      </Link>
                    )}

                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : showCancelled ? (
        /* Cancelled View Table */
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Project Brief</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Budget / Quote</th>
                  <th className="px-6 py-4">Cancelled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40 text-on-surface">
                {cancelledProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-outline">
                      <p className="text-sm font-semibold">No cancelled projects found</p>
                    </td>
                  </tr>
                ) : (
                  cancelledProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="font-bold text-on-surface hover:text-primary transition-colors text-sm"
                          >
                            {project.title}
                          </Link>
                          <p className="text-[10px] text-on-surface-variant mt-1">
                            {project.service?.name || project.customServiceText || "Custom"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-on-surface">{project.client.name || "Client"}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{project.client.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-on-surface">
                        ${parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline transition-colors"
                        >
                          <span>Manage</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Active Kanban Board */
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4 pt-1 select-none animate-fadeIn scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
            {columns.map((column) => {
              const columnProjects = activeProjects.filter((p) => p.status === column.id);
              return (
                <KanbanColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  projects={columnProjects}
                  notifications={notifications}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {/* Quote Amount entry dialog */}
      <QuoteEntryModal
        isOpen={selectedProjectForQuote !== null}
        project={selectedProjectForQuote}
        onSubmit={handleQuoteSubmit}
        onClose={() => {
          setSelectedProjectForQuote(null);
          setTargetStatusForQuote(null);
        }}
      />
    </div>
  );
}
