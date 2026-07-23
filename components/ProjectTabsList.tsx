"use client";

import { useState } from "react";
import Link from "next/link";
import { ProjectStatus } from "@prisma/client";

interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  proposedBudget: any;
  quoteAmount: any;
  createdAt: Date;
  service: { name: string } | null;
  customServiceText: string | null;
}

interface ProjectTabsListProps {
  projects: Project[];
}

export function ProjectTabsList({ projects }: ProjectTabsListProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Filtering logic
  const filteredProjects = projects.filter((project) => {
    // Tab filter
    if (activeTab === "ACTIVE") {
      if (
        project.status !== ProjectStatus.SUBMITTED &&
        project.status !== ProjectStatus.QUOTED &&
        project.status !== ProjectStatus.IN_PROGRESS
      ) {
        return false;
      }
    } else if (activeTab === "COMPLETED") {
      if (project.status !== ProjectStatus.COMPLETED) {
        return false;
      }
    }

    // Search query filter
    const titleMatch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const serviceName = project.service?.name || project.customServiceText || "Custom";
    const serviceMatch = serviceName.toLowerCase().includes(searchQuery.toLowerCase());

    return titleMatch || serviceMatch;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search & Segmented Filter Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container-lowest p-4 border border-outline-variant rounded-2xl">
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary focus:bg-surface-container-lowest rounded-full pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-outline outline-none transition-all"
          />
        </div>

        {/* Segmented Filter Tab Track */}
        <div className="flex bg-surface-container-high p-1 border border-outline-variant rounded-full w-full md:w-auto shrink-0">
          {[
            { id: "ALL", label: "All Projects" },
            { id: "ACTIVE", label: "Active" },
            { id: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-on-primary shadow-xs font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects or Styled Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-outline-variant rounded-2xl p-12 sm:p-16 text-center bg-surface-container-lowest min-h-[360px] flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-outline-variant flex items-center justify-center text-outline mb-4">
            <svg className="w-7 h-7 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <p className="text-base font-bold text-on-surface mb-1">No projects found</p>
          <p className="text-xs text-on-surface-variant max-w-md leading-relaxed mb-4">
            {searchQuery
              ? "No requests match your current search query. Try adjusting your search terms."
              : "You do not have any requests in this category. Start by creating a new project request to see it listed here."}
          </p>
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-1 text-xs font-bold text-primary hover:underline transition-colors"
          >
            <span className="text-sm">⊕</span>
            <span>Create first request</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="group flex flex-col justify-between p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-outline-variant bg-surface-container-low text-on-surface-variant">
                    {project.service?.name || project.customServiceText || "Custom"}
                  </span>
                  <span
                    className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      project.status === ProjectStatus.SUBMITTED
                        ? "bg-tertiary text-on-tertiary"
                        : project.status === ProjectStatus.QUOTED
                        ? "bg-secondary-container text-on-secondary-container"
                        : project.status === ProjectStatus.IN_PROGRESS
                        ? "bg-inverse-primary text-primary font-black"
                        : project.status === ProjectStatus.COMPLETED
                        ? "bg-primary text-on-primary"
                        : "bg-error text-on-error"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <h4 className="font-bold text-on-surface text-sm mb-2 group-hover:text-primary transition-colors line-clamp-1">
                  {project.title}
                </h4>
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-outline-variant/40 flex justify-between items-center text-xs text-on-surface-variant">
                <span className="font-medium">Budget / Quote</span>
                <span className="font-bold text-on-surface">
                  ${parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
