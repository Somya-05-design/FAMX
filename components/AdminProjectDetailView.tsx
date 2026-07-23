"use client";

import { useState, useRef } from "react";
import { ProjectStatus, TimelineTier } from "@prisma/client";
import { updateProjectStatusAction, updateQuoteAmountAction, toggleDisputeAction } from "@/app/actions/projects";
import { requestPaymentAction } from "@/app/actions/payments";
import { uploadAttachment } from "@/app/actions/attachments";
import { AttachmentLink } from "@/components/AttachmentLink";
import { ChatPanel } from "@/components/ChatPanel";
import { BudgetNegotiator } from "@/components/BudgetNegotiator";
import { AdminPaymentVerification } from "@/components/AdminPaymentVerification";
import Link from "next/link";

interface Attachment {
  id: string;
  fileName: string;
  sizeBytes: number;
}

interface Payment {
  id: string;
  amount: number;
  status: any;
  paymentMethod?: string | null;
  utrNumber?: string | null;
  receiptPath?: string | null;
  rejectionReason?: string | null;
  createdAt: Date | string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  requirements?: string | null;
  status: ProjectStatus;
  timelineTier: TimelineTier;
  customExpectedDate?: Date | string | null;
  proposedBudget: number;
  quoteAmount?: number | null;
  isDisputed: boolean;
  isBudgetFinalized?: boolean;
  lastNegotiatedBy?: "CLIENT" | "ADMIN" | null;
  negotiationHistory?: any[];
  createdAt: Date | string;
  updatedAt: Date | string;
  service?: { name: string } | null;
  customServiceText?: string | null;
  client: { name: string | null; email: string };
  attachments: Attachment[];
  payments: Payment[];
}

interface AdminProjectDetailViewProps {
  project: Project;
  currentUserId: string;
}

export function AdminProjectDetailView({ project: initialProject, currentUserId }: AdminProjectDetailViewProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [status, setStatus] = useState<ProjectStatus>(initialProject.status);
  const [isDisputed, setIsDisputed] = useState(initialProject.isDisputed);

  const numProposedBudget = Number(initialProject.proposedBudget);
  const numQuoteAmount = initialProject.quoteAmount ? Number(initialProject.quoteAmount) : null;

  const [quoteInput, setQuoteInput] = useState(numQuoteAmount?.toString() || "");
  const [quoteAmount, setQuoteAmount] = useState<number | null>(numQuoteAmount);

  const [invoiceInput, setInvoiceInput] = useState(numQuoteAmount?.toString() || numProposedBudget.toString());

  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isQuotePending, setIsQuotePending] = useState(false);
  const [isInvoicePending, setIsInvoicePending] = useState(false);
  const [isDisputePending, setIsDisputePending] = useState(false);
  const [isCancelPending, setIsCancelPending] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Status Change Handler
  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus;
    setIsStatusPending(true);

    try {
      const result = await updateProjectStatusAction(project.id, newStatus);
      setStatus(result.status as ProjectStatus);
      setProject((prev) => ({ ...prev, status: result.status as ProjectStatus, updatedAt: new Date().toISOString() }));
    } catch (err: any) {
      alert(err.message || "Failed to update project status");
      e.target.value = status;
    } finally {
      setIsStatusPending(false);
    }
  };

  // Quote Submission Handler
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(quoteInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid quote amount greater than 0");
      return;
    }

    setIsQuotePending(true);
    try {
      const result = await updateQuoteAmountAction(project.id, amount);
      const newQuote = result.quoteAmount ? Number(result.quoteAmount) : amount;
      setQuoteAmount(newQuote);
      if (status === ProjectStatus.SUBMITTED) {
        setStatus(ProjectStatus.QUOTED);
      }
      setProject((prev) => ({
        ...prev,
        quoteAmount: newQuote,
        status: status === ProjectStatus.SUBMITTED ? ProjectStatus.QUOTED : prev.status,
        updatedAt: new Date().toISOString(),
      }));
      alert("Quote updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update quote");
    } finally {
      setIsQuotePending(false);
    }
  };

  // Invoice / Payment Request Handler
  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(invoiceInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid invoice amount greater than 0");
      return;
    }

    setIsInvoicePending(true);
    try {
      await requestPaymentAction(project.id, amount);
      alert("Stripe Payment invoice created and sent successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create invoice");
    } finally {
      setIsInvoicePending(false);
    }
  };

  // Cancel Project Handler
  const handleCancelProject = async () => {
    if (!confirm("Are you sure you want to cancel this project?")) return;
    setIsCancelPending(true);
    try {
      const result = await updateProjectStatusAction(project.id, ProjectStatus.CANCELLED);
      setStatus(ProjectStatus.CANCELLED);
      setProject((prev) => ({ ...prev, status: ProjectStatus.CANCELLED, updatedAt: new Date().toISOString() }));
    } catch (err: any) {
      alert(err.message || "Failed to cancel project");
    } finally {
      setIsCancelPending(false);
    }
  };

  // Dispute Toggle Handler
  const handleDisputeToggle = async () => {
    setIsDisputePending(true);
    try {
      const result = await toggleDisputeAction(project.id, !isDisputed);
      setIsDisputed(result.isDisputed);
    } catch (err: any) {
      alert(err.message || "Failed to toggle dispute status");
    } finally {
      setIsDisputePending(false);
    }
  };

  // Upload Attachment Handler
  const handleUploadAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploadingAttachment(true);

    try {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);

      const uploaded = await uploadAttachment(data);
      setProject((prev) => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          { id: uploaded.id, fileName: file.name, sizeBytes: file.size },
        ],
      }));
    } catch (err: any) {
      alert(err.message || "Failed to upload attachment");
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = "";
      }
    }
  };

  // Format Timeline Tier
  const getTimelineDetails = (tier: TimelineTier) => {
    switch (tier) {
      case "INSTANT":
        return { label: "Instant / Rush", percent: "90%" };
      case "WITHIN_WEEK":
        return { label: "Within a Week", percent: "65%" };
      case "WITHIN_MONTH":
        return { label: "Within a Month", percent: "35%" };
      case "CUSTOM_DATE":
        return { label: "Custom Date", percent: "100%" };
      default:
        return { label: tier, percent: "50%" };
    }
  };

  const timelineInfo = getTimelineDetails(project.timelineTier);

  // Status Badge Class per §2 & §3 semantic status chips
  const getStatusBadgeStyle = (st: ProjectStatus) => {
    switch (st) {
      case "SUBMITTED":
        return "bg-tertiary text-on-tertiary border-tertiary";
      case "QUOTED":
        return "bg-secondary-container text-on-secondary-container border-secondary-container";
      case "IN_PROGRESS":
        return "bg-inverse-primary text-primary border-primary/20 font-black";
      case "COMPLETED":
        return "bg-primary text-on-primary border-primary";
      case "CANCELLED":
        return "bg-error text-on-error border-error";
      default:
        return "bg-surface-container-high text-on-surface-variant border-outline-variant";
    }
  };

  // Format Relative Time
  const formatRelativeTime = (dateVal: Date | string) => {
    const date = new Date(dateVal);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6 animate-fadeIn select-none">
      {/* Back Link & Payment Settings Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Console</span>
        </Link>

        <Link
          href="/admin/settings/payment"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-primary hover:underline bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/50"
        >
          <span>⚙️ Payment Methods & Barcode Settings</span>
        </Link>
      </div>

      {/* Payment Verification Panel if proof submitted */}
      {project.payments && project.payments.length > 0 && project.payments[0].status === "PENDING_VERIFICATION" && (
        <AdminPaymentVerification payment={project.payments[0] as any} />
      )}

      {/* Budget Negotiation Thread */}
      <BudgetNegotiator
        projectId={project.id}
        userRole="ADMIN"
        currentProposedBudget={project.proposedBudget}
        currentQuoteAmount={project.quoteAmount || null}
        isBudgetFinalized={Boolean(project.isBudgetFinalized)}
        lastNegotiatedBy={project.lastNegotiatedBy || null}
        history={project.negotiationHistory || []}
      />

      {/* 1. Header Bar Section */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 shadow-xs flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5">
        {/* Title, Status, and Client info */}
        <div className="space-y-1 min-w-0 max-w-lg">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1">
            <h1 className="text-2xl font-black text-on-surface tracking-tight truncate">{project.title}</h1>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black tracking-wider uppercase border ${getStatusBadgeStyle(status)}`}>
              {status}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium truncate">
            👤 <span className="text-on-surface font-bold">{project.client.name || "Client"}</span> - {project.client.email}
          </p>
        </div>

        {/* Action Controls & Stat boxes cluster */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* BUDGET Stat Box */}
          <div className="bg-surface-container-low border border-outline-variant px-4 py-2 rounded-2xl min-w-[100px]">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">BUDGET</span>
            <span className="text-base font-black text-on-surface">
              ${numProposedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* FINAL DATE Stat Box */}
          <div className="bg-surface-container-low border border-outline-variant px-4 py-2 rounded-2xl min-w-[100px]">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">FINAL DATE</span>
            <span className="text-xs font-black text-on-surface block mt-0.5">
              {project.customExpectedDate ? new Date(project.customExpectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Not Set"}
            </span>
          </div>

          {/* Quote Inline Form */}
          <form onSubmit={handleQuoteSubmit} className="flex items-center space-x-1.5 bg-surface-container-low border border-outline-variant p-1 rounded-2xl">
            <span className="text-xs font-bold text-on-surface-variant pl-3">Quote $</span>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              placeholder={numProposedBudget.toString()}
              min="0.01"
              step="0.01"
              disabled={isQuotePending}
              className="w-20 bg-transparent text-xs font-bold text-on-surface outline-none py-1.5"
            />
            <button
              type="submit"
              disabled={isQuotePending}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isQuotePending ? "..." : "Apply"}
            </button>
          </form>

          {/* Invoice Inline Form */}
          <form onSubmit={handleInvoiceSubmit} className="flex items-center space-x-1.5 bg-surface-container-low border border-outline-variant p-1 rounded-2xl">
            <span className="text-xs font-bold text-on-surface-variant pl-3">Invoice $</span>
            <input
              ref={invoiceInputRef}
              type="number"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder={(quoteAmount || numProposedBudget).toString()}
              min="0.01"
              step="0.01"
              disabled={isInvoicePending}
              className="w-20 bg-transparent text-xs font-bold text-on-surface outline-none py-1.5"
            />
            <button
              type="submit"
              disabled={isInvoicePending}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isInvoicePending ? "..." : "Send"}
            </button>
          </form>

          {/* Cancel Project Button */}
          {status !== ProjectStatus.CANCELLED && (
            <button
              onClick={handleCancelProject}
              disabled={isCancelPending}
              className="bg-error hover:bg-error/90 text-on-error font-bold text-xs px-4 py-2.5 rounded-2xl transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>CANCEL PROJECT</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column — Project Brief (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/60">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider">PROJECT BRIEF</h3>
              </div>
              <span className="text-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </span>
            </div>

            {/* Description Block */}
            <div className="bg-surface-container-low p-4.5 rounded-2xl space-y-1.5 border border-outline-variant/60">
              <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider block">DESCRIPTION</span>
              <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                {project.description}
              </p>
            </div>

            {/* Technical Requirements Block */}
            {project.requirements && (
              <div className="bg-surface-container-low p-4.5 rounded-2xl space-y-1.5 border border-outline-variant/60">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider block">TECHNICAL REQUIREMENTS</span>
                <p className="text-xs text-on-surface leading-relaxed whitespace-pre-wrap font-medium">
                  {project.requirements}
                </p>
              </div>
            )}

            {/* Target Timeline Tier */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">TARGET TIMELINE TIER</span>
                <span className="text-xs font-bold text-on-surface">{timelineInfo.label}</span>
              </div>
              <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden p-0.5 border border-outline-variant/60">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: timelineInfo.percent }}
                />
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider">ATTACHMENTS</span>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleUploadAttachment}
                  disabled={isUploadingAttachment}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="text-xs font-bold text-primary hover:underline transition-colors cursor-pointer"
                >
                  {isUploadingAttachment ? "Uploading..." : "+ Add File"}
                </button>
              </div>

              {project.attachments.length === 0 ? (
                <div
                  onClick={() => attachmentInputRef.current?.click()}
                  className="bg-surface-container-low border border-dashed border-outline-variant p-8 rounded-2xl text-center space-y-2 cursor-pointer hover:border-primary transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-inverse-primary/20 text-primary flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-on-surface">No attachments provided.</p>
                  <p className="text-[10px] text-on-surface-variant font-medium">Drag and drop files here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.attachments.map((file) => (
                    <AttachmentLink
                      key={file.id}
                      id={file.id}
                      fileName={file.fileName}
                      sizeBytes={file.sizeBytes}
                      variant="light"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Column — Control Center (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 shadow-xs space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-2 pb-3 border-b border-outline-variant/60">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h97.5M10.5 12h97.5M10.5 18h97.5M3 6h.01M3 12h.01M3 18h.01" />
              </svg>
              <h3 className="text-xs font-extrabold text-on-surface uppercase tracking-wider">CONTROL CENTER</h3>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider">
                PROJECT STATUS
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={handleStatusChange}
                  disabled={isStatusPending}
                  className="w-full bg-surface-container-low border border-outline-variant text-on-surface text-sm font-bold rounded-2xl px-4 py-3 outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary transition-all cursor-pointer appearance-none"
                >
                  {[
                    { value: ProjectStatus.SUBMITTED, label: "Submitted" },
                    { value: ProjectStatus.QUOTED, label: "Quoted" },
                    { value: ProjectStatus.IN_PROGRESS, label: "In Progress" },
                    { value: ProjectStatus.COMPLETED, label: "Completed" },
                    { value: ProjectStatus.CANCELLED, label: "Cancelled" },
                  ].filter(opt => {
                    if (opt.value === status) return true;
                    if (status === ProjectStatus.SUBMITTED) {
                      return opt.value === ProjectStatus.QUOTED || opt.value === ProjectStatus.CANCELLED;
                    }
                    if (status === ProjectStatus.QUOTED) {
                      return opt.value === ProjectStatus.IN_PROGRESS || opt.value === ProjectStatus.CANCELLED;
                    }
                    if (status === ProjectStatus.IN_PROGRESS) {
                      return opt.value === ProjectStatus.COMPLETED || opt.value === ProjectStatus.CANCELLED;
                    }
                    if (status === ProjectStatus.COMPLETED) {
                      return opt.value === ProjectStatus.IN_PROGRESS || opt.value === ProjectStatus.CANCELLED;
                    }
                    return false;
                  }).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {status === ProjectStatus.COMPLETED && opt.value === ProjectStatus.IN_PROGRESS ? "Reopen (In Progress)" : opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-outline">
                  {isStatusPending ? (
                    <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            {/* Last Updated Notice */}
            <div className="bg-surface-container-high border border-outline-variant p-3 rounded-2xl flex items-center space-x-2 text-xs text-on-surface-variant font-bold">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>Last updated {formatRelativeTime(project.updatedAt)}</span>
            </div>

            {/* Invoices & Payments Block */}
            <div className="space-y-3 pt-2 border-t border-outline-variant/60">
              <span className="text-[10px] font-extrabold text-outline uppercase tracking-wider block">INVOICES & PAYMENTS</span>
              
              {project.payments.length === 0 ? (
                <div className="bg-surface-container-lowest border border-dashed border-outline-variant p-6 rounded-2xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-inverse-primary/20 text-primary flex items-center justify-center mx-auto">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.257c0-.89.65-1.64 1.536-1.74A12.015 12.015 0 0112 2.25c2.43 0 4.71.72 6.614 1.957.886.1 1.536.85 1.536 1.74z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">No invoices created</p>
                    <p className="text-[10px] text-on-surface-variant mt-1 leading-relaxed">
                      Payment requests generate Stripe Checkout links for the client.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => invoiceInputRef.current?.focus()}
                    className="w-full py-2 bg-surface-container-lowest border border-outline-variant hover:bg-surface-container-low text-on-surface font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Create Manual Invoice
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {project.payments.map((payment) => {
                    const numAmt = Number(payment.amount);
                    return (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs">
                        <div>
                          <p className="font-bold text-on-surface">
                            ${numAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                            payment.status === "SUCCEEDED"
                              ? "bg-primary text-on-primary border-primary"
                              : payment.status === "PENDING"
                              ? "bg-secondary-container text-on-secondary-container border-secondary-container"
                              : "bg-error text-on-error border-error"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dispute Toggle */}
            {status === ProjectStatus.COMPLETED && (
              <div className="p-4 bg-surface-container-low border border-outline-variant/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface">Dispute Flag</span>
                  <button
                    onClick={handleDisputeToggle}
                    disabled={isDisputePending}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isDisputed
                        ? "bg-error text-on-error shadow-xs"
                        : "bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    {isDisputePending ? "..." : isDisputed ? "Disputed 🚩" : "Flag Dispute"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Discussion (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col h-full min-h-[550px]">
            {/* Discussion Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-100 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
                <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">DISCUSSION</h3>
              </div>
            </div>

            {/* Live Chat Panel Component with Light Theme */}
            <div className="flex-1 min-h-0">
              <ChatPanel projectId={project.id} currentUserId={currentUserId} theme="light" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
