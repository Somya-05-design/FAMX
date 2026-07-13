import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/data/projects";
import { AttachmentLink } from "@/components/AttachmentLink";
import { AdminProjectManager } from "@/components/AdminProjectManager";
import Link from "next/link";

export default async function AdminProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  // Retrieve project details (as admin, RLS allows this query to return any project)
  const project = await getProjectById(session, id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back to Console Header */}
      <div>
        <Link
          href="/admin"
          className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Console</span>
        </Link>
      </div>

      {/* Hero / Summary Block */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-zinc-900/20 border border-zinc-800/80 p-6 rounded-2xl">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center space-x-3 flex-wrap gap-y-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-zinc-800 bg-zinc-900 text-zinc-400">
              {project.service?.name || project.customServiceText || "Custom"}
            </span>
            <span
              className={`text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                project.status === "SUBMITTED"
                  ? "bg-amber-950/40 text-amber-400 border border-amber-800/25"
                  : project.status === "QUOTED"
                  ? "bg-violet-950/40 text-violet-400 border border-violet-800/25"
                  : project.status === "IN_PROGRESS"
                  ? "bg-blue-950/40 text-blue-400 border border-blue-800/25"
                  : project.status === "COMPLETED"
                  ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/25"
                  : "bg-zinc-800/40 text-zinc-400 border border-zinc-700/25"
              }`}
            >
              {project.status}
            </span>
            {project.isDisputed && (
              <span className="text-[9px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider bg-rose-950/40 text-rose-400 border border-rose-800/25">
                Disputed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 truncate">{project.title}</h1>
          <p className="text-xs text-zinc-500">Submitted by {project.client.name || "Client"} ({project.client.email})</p>
        </div>

        {/* Financial Highlights */}
        <div className="flex gap-4">
          <div className="bg-zinc-950 p-4 border border-zinc-800/60 rounded-xl min-w-[130px]">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Proposed Budget</p>
            <p className="text-lg font-extrabold text-zinc-300 mt-1">
              ${project.proposedBudget.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-zinc-950 p-4 border border-zinc-800/60 rounded-xl min-w-[130px]">
            <p className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Final Quote</p>
            <p className="text-lg font-extrabold text-violet-400 mt-1">
              {project.quoteAmount 
                ? `$${project.quoteAmount.toNumber().toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
                : "Not Set"}
            </p>
          </div>
        </div>
      </div>

      {/* Main split: Brief vs Management Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Client Requirements and Attachments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Brief / Description</h3>
              <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>

            {project.requirements && (
              <div>
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Technical Requirements</h3>
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{project.requirements}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-900">
              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Target Timeline Tier</h3>
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
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Requested Delivery Date</h3>
                  <p className="text-xs font-semibold text-zinc-300 mt-1">
                    {new Date(project.customExpectedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Project Attachments */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Brief Attachments</h3>
            {project.attachments.length === 0 ? (
              <p className="text-xs text-zinc-500">No attachments provided for this request.</p>
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

        {/* Right Column: Admin Actions, Payments, and Activity Chat */}
        <div className="space-y-6">
          {/* Admin status and quote controls */}
          <AdminProjectManager
            projectId={project.id}
            initialStatus={project.status}
            initialQuoteAmount={project.quoteAmount ? project.quoteAmount.toNumber() : null}
            initialIsDisputed={project.isDisputed}
            proposedBudget={project.proposedBudget.toNumber()}
          />

          {/* Payment Invoice requests */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Invoices & Payments</h3>
            {project.payments.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-zinc-500 font-medium">No invoices created.</p>
                <p className="text-[10px] text-zinc-600 mt-1">Ready for Payment actions are configured in Phase 3.</p>
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
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel placeholder */}
          <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-2xl p-6 h-[300px] flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Project Activity Chat</h3>
              <p className="text-[10px] text-zinc-500">Communicate directly with the client.</p>
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
