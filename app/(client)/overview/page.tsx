import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/data/projects";
import { prisma } from "@/lib/prisma";
import { ProjectStatus } from "@prisma/client";

export default async function ClientOverviewPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const projects = await getProjectsForUser(session);

  // Calculate statistics
  const totalProjects = projects.length;
  
  const activeProjects = projects.filter(
    (p) =>
      p.status === ProjectStatus.SUBMITTED ||
      p.status === ProjectStatus.QUOTED ||
      p.status === ProjectStatus.IN_PROGRESS
  ).length;

  const completedProjects = projects.filter(
    (p) => p.status === ProjectStatus.COMPLETED
  ).length;

  // Retrieve sum of succeeded payments for the total money spent stat
  const succeededPayments = await prisma.payment.findMany({
    where: {
      project: { clientId: session.user.id },
      status: "SUCCEEDED",
    },
  });

  const totalSpent = succeededPayments.reduce(
    (sum, p) => sum + p.amount.toNumber(),
    0
  );

  // Take the top 3 most recently updated projects for preview
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Welcome, {session.user.name || "Client"}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Track your ongoing requests and submit new briefs to our engineering team.
          </p>
        </div>
      </div>

      {/* Hero Card / Call to Action */}
      <div className="relative overflow-hidden bg-primary border border-primary-container rounded-2xl p-8 md:p-10 text-on-primary shadow-xs">
        <div className="absolute top-0 right-0 w-80 h-80 bg-inverse-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-xl">
          <h2 className="text-xl md:text-2xl font-bold text-on-primary mb-2">
            Ready to bring your ideas to life?
          </h2>
          <p className="text-sm text-on-primary/80 leading-relaxed mb-6">
            Submit a new project request. Provide your technical specifications, assets, and proposed budget. Our team will issue a binding quote shortly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects/new"
              className="bg-surface-container-lowest hover:bg-surface-container-low text-primary font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-xs cursor-pointer"
            >
              Start a Project
            </Link>
            <Link
              href="/projects"
              className="bg-tertiary hover:bg-tertiary-container text-on-tertiary border border-transparent font-bold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer"
            >
              View My Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Projects", value: totalProjects },
          { label: "Active Requests", value: activeProjects },
          { label: "Completed", value: completedProjects },
          {
            label: "Total Spent",
            value: `$${totalSpent.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-6 rounded-2xl border border-outline-variant bg-surface-container-lowest"
          >
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-on-surface mt-2 tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-on-surface">Recent Projects</h3>
          {totalProjects > 3 && (
            <Link href="/projects" className="text-xs text-primary hover:text-primary-container font-bold">
              View All
            </Link>
          )}
        </div>

        {recentProjects.length === 0 ? (
          <div className="border border-dashed border-outline-variant rounded-2xl p-12 text-center bg-surface-container-lowest">
            <svg className="w-10 h-10 text-outline mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-sm font-bold text-on-surface">No projects submitted yet</p>
            <p className="text-xs text-on-surface-variant mt-1">Get started by creating your very first project request</p>
            <Link
              href="/projects/new"
              className="inline-block mt-4 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group flex flex-col justify-between p-6 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary transition-all duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold border border-outline-variant bg-surface-container-low text-on-surface-variant">
                      {project.service?.name || "Custom"}
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
                  <h4 className="font-bold text-on-surface group-hover:text-primary transition-colors text-sm truncate mb-2">
                    {project.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4">
                    {project.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-outline-variant/40 flex justify-between items-center text-xs text-on-surface-variant">
                  <span className="font-semibold">Budget/Quote:</span>
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
    </div>
  );
}
