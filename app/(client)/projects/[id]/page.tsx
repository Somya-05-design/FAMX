import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import { getAdminPaymentSettings } from "@/lib/data/payments";
import { CancelProjectButton } from "@/components/CancelProjectButton";
import { AttachmentLink } from "@/components/AttachmentLink";
import { BudgetNegotiator } from "@/components/BudgetNegotiator";
import { PaymentSection } from "@/components/PaymentSection";
import { ChatPanel } from "@/components/ChatPanel";
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

  const [project, settings] = await Promise.all([
    getProjectById(session, id),
    getAdminPaymentSettings(),
  ]);

  if (!project) {
    notFound();
  }

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

  const activePayment = project.payments[0] || null;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link
          href="/projects"
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Projects</span>
        </Link>

        <CancelProjectButton projectId={project.id} status={project.status} />
      </div>

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
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
            {project.isBudgetFinalized && (
              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Budget Finalized
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-on-surface truncate">{project.title}</h1>
          <p className="text-xs text-on-surface-variant">Created on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="text-right bg-surface-container-low p-4 border border-outline-variant rounded-xl min-w-[170px]">
          <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
            {project.isBudgetFinalized ? "Final Agreed Budget" : "Current Quoted / Proposed"}
          </p>
          <p className="text-xl font-extrabold text-on-surface mt-1">
            ₹{parseFloat((project.quoteAmount || project.proposedBudget).toString()).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Progress Lifecycle Bar */}
      {project.status !== ProjectStatus.CANCELLED && (
        <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-6">Project Progress</h3>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-container-high -translate-y-1/2 rounded-full" />
            <div className={`absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full ${getProgressWidth(project.status)} transition-all duration-500`} />
            
            <div className="relative z-10 flex justify-between">
              {[
                { status: ProjectStatus.SUBMITTED, label: "Submitted" },
                { status: ProjectStatus.QUOTED, label: "Negotiating & Quoted" },
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
                          ? "bg-primary border-primary text-on-primary"
                          : "bg-surface-container-lowest border-outline-variant text-outline"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="w-1.5 h-1.5 bg-outline rounded-full" />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold mt-2 ${isCompleted ? "text-on-surface font-bold" : "text-on-surface-variant"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Details Panel & Negotiation / Payment */}
        <div className="lg:col-span-2 space-y-6">

          {/* Payment Section if budget is finalized */}
          {project.isBudgetFinalized && activePayment && (
            <PaymentSection
              projectId={project.id}
              payment={activePayment}
              settings={settings}
              userRole="CLIENT"
            />
          )}

          {/* Budget Negotiation Section */}
          <BudgetNegotiator
            projectId={project.id}
            userRole="CLIENT"
            currentProposedBudget={project.proposedBudget}
            currentQuoteAmount={project.quoteAmount}
            isBudgetFinalized={project.isBudgetFinalized}
            lastNegotiatedBy={project.lastNegotiatedBy}
            history={project.negotiationHistory}
          />

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Description / Scope</h3>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.requirements && (
              <div>
                <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Additional Specifications</h3>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap">{project.requirements}</p>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Brief Attachments</h3>
            {project.attachments.length === 0 ? (
              <p className="text-xs text-on-surface-variant">No attachments uploaded for this brief.</p>
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

        {/* Side Panel: Live Chat */}
        <div className="space-y-6">
          <ChatPanel projectId={project.id} currentUserId={session.user.id} />
        </div>

      </div>
    </div>
  );
}
