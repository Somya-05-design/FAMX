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
      {/* Controls Bar: Search & Filter Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/30 p-4 border border-zinc-800/80 rounded-2xl">
        {/* Search input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute left-3.5 top-3 text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title or service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none transition-all"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl w-full md:w-auto">
          {[
            { id: "ALL", label: "All Projects" },
            { id: "ACTIVE", label: "Active" },
            { id: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <div className="border border-zinc-800 rounded-2xl p-16 text-center bg-zinc-900/10">
          <svg className="w-12 h-12 text-zinc-700 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm font-semibold text-zinc-400">No projects found</p>
          <p className="text-xs text-zinc-500 mt-1">
            {searchQuery
              ? "Try adjusting your search terms or filters."
              : "You do not have any requests in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex flex-col justify-between p-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl hover:border-zinc-700 hover:-translate-y-1 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-zinc-800 bg-zinc-900 text-zinc-400">
                    {project.service?.name || project.customServiceText || "Custom"}
                  </span>
                  <span
                    className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                      project.status === ProjectStatus.SUBMITTED
                        ? "bg-amber-950/40 text-amber-400 border border-amber-800/30"
                        : project.status === ProjectStatus.QUOTED
                        ? "bg-violet-950/40 text-violet-400 border border-violet-800/30"
                        : project.status === ProjectStatus.IN_PROGRESS
                        ? "bg-blue-950/40 text-blue-400 border border-blue-800/30"
                        : project.status === ProjectStatus.COMPLETED
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/30"
                        : "bg-zinc-850/40 text-zinc-400 border border-zinc-800/30"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-200 text-sm mb-2 truncate">
                  {project.title}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-6">
                  {project.description}
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-900 flex justify-between items-center text-xs">
                <span className="text-zinc-500 font-semibold">Budget / Quote:</span>
                <span className="font-bold text-zinc-300">
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
