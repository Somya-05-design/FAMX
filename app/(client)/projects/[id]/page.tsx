import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import { CancelProjectButton } from "@/components/CancelProjectButton";
import { AttachmentLink } from "@/components/AttachmentLink";
import { PayNowButton } from "@/components/PayNowButton";
import { ProjectStatus } from "@prisma/client";
import Link from "next/link";

export default async function ClientProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const project = await getProjectById(session, id);

  if (!project) {
    notFound();
  }

  // Calculate status indicator progress width
  const getProgressWidth = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.SUBMITTED:
        return "w-1/4";
      case ProjectStatus.QUOTED:
        return "w-2/4";
      case ProjectStatus.IN_PROGRESS:
        return "w-3/4";
      case ProjectStatus.COMPLETED:
        return "w-full";
      case ProjectStatus.CANCELLED:
        return "w-0";
      default:
        return "w-0";
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back to list & cancel action header */}
      <div className="flex justify-between items-center">
        <Link
          href="/projects"
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Projects</span>
        </Link>

        {/* Cancel Action Button */}
        <CancelProjectButton projectId={project.id} status={project.status} />
      </div>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/20 border border-zinc-800/80 p-6 rounded-2xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
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
                  : "bg-zinc-800/40 text-zinc-400 border border-zinc-700/30"
              }`}
            >
              {project.status}
            </span>
            {project.isDisputed && (
              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-rose-950/40 text-rose-400 border border-rose-800/30">
                Disputed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 truncate">{project.title}</h1>
          <p className="text-xs text-zinc-500">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="text-right bg-zinc-950 p-4 border border-zinc-800/60 rounded-xl min-w-[150px]">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">
            {project.quoteAmount ? "Final Quote" : "Proposed Budget"}
          </p>
          <p className="text-xl font-extrabold text-zinc-100 mt-1">
            ${parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Progress Lifecycle Bar (Skip if Cancelled) */}
      {project.status !== ProjectStatus.CANCELLED && (
        <div className="bg-zinc-900/20 border border-zinc-800/80 p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-6">Project Progress</h3>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-800 -translate-y-1/2 rounded-full" />
            <div className={`absolute top-1/2 left-0 h-1 bg-violet-600 -translate-y-1/2 rounded-full ${getProgressWidth(project.status)} transition-all duration-500`} />
            
            <div className="relative z-10 flex justify-between">
              {[
                { status: ProjectStatus.SUBMITTED, label: "Submitted" },
                { status: ProjectStatus.QUOTED, label: "Quoted" },
                { status: ProjectStatus.IN_PROGRESS, label: "In Progress" },
                { status: ProjectStatus.COMPLETED, label: "Completed" },
              ].map((step, idx) => {
                const isCompleted = 
                  (project.status === ProjectStatus.SUBMITTED && idx <= 0) ||
                  (project.status === ProjectStatus.QUOTED && idx <= 1) ||
                  (project.status === ProjectStatus.IN_PROGRESS && idx <= 2) ||
                  (project.status === ProjectStatus.COMPLETED && idx <= 3);

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        isCompleted
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "bg-zinc-950 border-zinc-800 text-zinc-600"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold mt-2 ${isCompleted ? "text-zinc-300" : "text-zinc-600"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main layout split: Details vs Activity (Stripe/Chat) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Description / Scope</h3>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.requirements && (
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Additional Specifications</h3>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{project.requirements}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Timeline Request</h3>
                <p className="text-xs font-semibold text-zinc-300 mt-1">
                  {project.timelineTier === "INSTANT"
                    ? "Instant / Rush"
                    : project.timelineTier === "WITHIN_WEEK"
                    ? "Within a Week"
                    : project.timelineTier === "WITHIN_MONTH"
                    ? "Within a Month"
                    : "Custom Date"}
                </p>
              </div>
              {project.customExpectedDate && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Delivery Date</h3>
                  <p className="text-xs font-semibold text-zinc-300 mt-1">
                    {new Date(project.customExpectedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Brief Attachments</h3>
            {project.attachments.length === 0 ? (
              <p className="text-xs text-zinc-500">No attachments uploaded for this brief.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.attachments.map((file) => (
                  <AttachmentLink
                    key={file.id}
                    id={file.id}
                    fileName={file.fileName}
                    sizeBytes={file.sizeBytes}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Panel: Payments & Chat placeholder */}
        <div className="space-y-6">
          {/* Payment Section (Milestones & Invoices) */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Payments & Invoices</h3>
            {project.payments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-500">No invoices generated yet.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Payments will be requested by Admin as work advances.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs">
                    <div>
                      <p className="font-semibold text-zinc-300">
                        ${payment.amount.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[9px] text-zinc-500 mt-0.5">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {payment.status === "PENDING" && (
                        <PayNowButton paymentId={payment.id} />
                      )}
                      <span
                        className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                          payment.status === "SUCCEEDED"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20"
                            : payment.status === "PENDING"
                            ? "bg-amber-950/40 text-amber-400 border border-amber-800/20"
                            : "bg-rose-950/40 text-rose-400 border border-rose-800/20"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel placeholder */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 h-[300px] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Activity Chat</h3>
              <p className="text-[10px] text-zinc-500">Communicate directly with our designers and engineers.</p>
            </div>
            
            <div className="text-center py-10">
              <svg className="w-8 h-8 text-zinc-700 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-xs text-zinc-500 font-medium">Chat is locked during setup</p>
              <p className="text-[9px] text-zinc-600 mt-0.5">Wired in Phase 4</p>
            </div>

            <div className="border-t border-zinc-900 pt-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Chat disabled..."
                  disabled
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-3 py-2 text-xs text-zinc-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
