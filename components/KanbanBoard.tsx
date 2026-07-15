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
import { getNotificationsAction } from "@/app/actions/notifications";
import { createClient } from "@/lib/supabase/client";
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
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [showCancelled, setShowCancelled] = useState(false);

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

  // Extract unique service categories
  const categories = Array.from(
    new Set(
      projects
        .map((p) => p.service?.name || p.customServiceText || "Custom")
        .filter(Boolean)
    )
  );

  // Filter projects by Search and Service Category
  const filteredProjects = projects.filter((project) => {
    // Search filter
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.client.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.client.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Service category filter
    if (serviceFilter !== "ALL") {
      const categoryName = project.service?.name || project.customServiceText || "Custom";
      if (categoryName !== serviceFilter) return false;
    }

    return true;
  });

  // Partition projects into Active and Cancelled
  const activeProjects = filteredProjects.filter((p) => p.status !== "CANCELLED");
  const cancelledProjects = filteredProjects.filter((p) => p.status === "CANCELLED");

  // Columns specification (excluding CANCELLED)
  const columns: { id: ProjectStatus; title: string }[] = [
    { id: "SUBMITTED", title: "Submitted" },
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
      alert(`Invalid transition from ${sourceStatus} to ${destStatus}. Drags can only move forward one step (Submitted → Quoted → In Progress → Completed).`);
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

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 p-4 border border-zinc-800/80 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64 md:w-80">
            <span className="absolute left-3.5 top-3 text-zinc-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by title or client name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none transition-all"
            />
          </div>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-violet-500 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Show Cancelled Toggle */}
        <button
          onClick={() => setShowCancelled(!showCancelled)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            showCancelled
              ? "bg-rose-950/40 border-rose-800/60 text-rose-400"
              : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300"
          }`}
        >
          {showCancelled ? "Show Active Board" : "Show Cancelled Projects"}
        </button>
      </div>

      {/* Main View Area */}
      {showCancelled ? (
        /* Cancelled View Table */
        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md animate-fadeIn">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Project Brief</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Budget / Quote</th>
                  <th className="px-6 py-4">Cancelled Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {cancelledProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      <p className="text-sm font-semibold">No cancelled projects found</p>
                    </td>
                  </tr>
                ) : (
                  cancelledProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/admin/projects/${project.id}`}
                            className="font-bold text-zinc-200 hover:text-violet-400 transition-colors text-sm"
                          >
                            {project.title}
                          </Link>
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {project.service?.name || project.customServiceText || "Custom"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-zinc-300">{project.client.name || "Client"}</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{project.client.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-300">
                        ${parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/projects/${project.id}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
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
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none animate-fadeIn scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
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
