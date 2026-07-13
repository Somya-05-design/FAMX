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
  updatedAt: Date;
  service: { name: string } | null;
  customServiceText: string | null;
  client: { name: string | null; email: string };
}

interface AdminProjectsListProps {
  projects: Project[];
}

export function AdminProjectsList({ projects }: AdminProjectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortAscending, setSortAscending] = useState(false); // Default newest first

  // Filter & Sort projects
  const processedProjects = projects
    .filter((project) => {
      // Status filter
      if (statusFilter !== "ALL" && project.status !== statusFilter) {
        return false;
      }

      // Search matches title, client name, or client email
      const matchesTitle = project.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClientName = (project.client.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClientEmail = project.client.email.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTitle || matchesClientName || matchesClientEmail;
    })
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortAscending ? dateA - dateB : dateB - dateA;
    });

  return (
    <div className="space-y-6">
      {/* Controls: Search bar and Status filter tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-zinc-900/30 p-4 border border-zinc-800/80 rounded-2xl">
        {/* Search */}
        <div className="relative w-full xl:max-w-sm">
          <span className="absolute left-3.5 top-3 text-zinc-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title, client name, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap bg-zinc-950 p-1 border border-zinc-800 rounded-xl gap-1 w-full xl:w-auto">
          {[
            { id: "ALL", label: "All" },
            { id: ProjectStatus.SUBMITTED, label: "Submitted" },
            { id: ProjectStatus.QUOTED, label: "Quoted" },
            { id: ProjectStatus.IN_PROGRESS, label: "In Progress" },
            { id: ProjectStatus.COMPLETED, label: "Completed" },
            { id: ProjectStatus.CANCELLED, label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Project Brief</th>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Budget / Quote</th>
                <th className="px-6 py-4 cursor-pointer hover:text-zinc-200 select-none" onClick={() => setSortAscending(!sortAscending)}>
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    <svg className={`w-3.5 h-3.5 transform transition-transform ${sortAscending ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {processedProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    <p className="text-sm font-semibold">No matching projects found</p>
                  </td>
                </tr>
              ) : (
                processedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* Brief / Service */}
                    <td className="px-6 py-4">
                      <div>
                        <Link href={`/admin/projects/${project.id}`} className="font-bold text-zinc-200 hover:text-violet-400 transition-colors text-sm">
                          {project.title}
                        </Link>
                        <p className="text-[10px] text-zinc-500 mt-1">
                          {project.service?.name || project.customServiceText || "Custom"}
                        </p>
                      </div>
                    </td>

                    {/* Client info */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-zinc-300">{project.client.name || "Client"}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{project.client.email}</p>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          project.status === ProjectStatus.SUBMITTED
                            ? "bg-amber-950/40 text-amber-400 border border-amber-800/20"
                            : project.status === ProjectStatus.QUOTED
                            ? "bg-violet-950/40 text-violet-400 border border-violet-800/20"
                            : project.status === ProjectStatus.IN_PROGRESS
                            ? "bg-blue-950/40 text-blue-400 border border-blue-800/20"
                            : project.status === ProjectStatus.COMPLETED
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20"
                            : "bg-zinc-800/40 text-zinc-400 border border-zinc-700/20"
                        }`}
                      >
                        {project.status}
                      </span>
                    </td>

                    {/* Budget / Quote value */}
                    <td className="px-6 py-4 font-bold text-zinc-300">
                      ${parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                      {project.quoteAmount && <span className="text-[9px] text-violet-400 font-semibold block mt-0.5">Quoted</span>}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-zinc-400">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
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
    </div>
  );
}
