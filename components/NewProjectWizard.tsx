"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TimelineTier } from "@prisma/client";
import { uploadAttachment } from "@/app/actions/attachments";
import { createProjectAction } from "@/app/actions/projects";

interface Service {
  id: string;
  name: string;
  description: string | null;
}

interface NewProjectWizardProps {
  services: Service[];
}

export function NewProjectWizard({ services }: NewProjectWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    serviceId: "",
    customServiceText: "",
    title: "",
    description: "",
    requirements: "",
    proposedBudget: "",
    timelineTier: TimelineTier.WITHIN_WEEK as TimelineTier,
    customExpectedDate: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<Array<{ id: string; fileName: string; sizeBytes: number }>>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);

    try {
      const file = e.target.files[0];
      const data = new FormData();
      data.append("file", file);

      const attachment = await uploadAttachment(data);
      setUploadedFiles((prev) => [...prev, attachment]);
    } catch (err: any) {
      alert(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleServiceSelect = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceId: id,
      customServiceText: id !== "other" ? "" : prev.customServiceText,
    }));
  };

  const nextStep = () => {
    // Basic validation per step
    if (step === 1 && !formData.serviceId) {
      alert("Please select a service category");
      return;
    }
    if (step === 1 && formData.serviceId === "other" && !formData.customServiceText) {
      alert("Please specify the custom service text");
      return;
    }
    if (step === 2 && (!formData.title || !formData.description)) {
      alert("Please fill in the project title and description");
      return;
    }
    if (step === 3) {
      const budget = parseFloat(formData.proposedBudget);
      if (isNaN(budget) || budget <= 0) {
        alert("Please enter a valid proposed budget");
        return;
      }
      if (formData.timelineTier === TimelineTier.CUSTOM_DATE && !formData.customExpectedDate) {
        alert("Please select an expected delivery date");
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const projectInput = {
        serviceId: formData.serviceId === "other" ? undefined : formData.serviceId,
        customServiceText: formData.serviceId === "other" ? formData.customServiceText : undefined,
        title: formData.title,
        description: formData.description,
        requirements: formData.requirements || undefined,
        proposedBudget: parseFloat(formData.proposedBudget),
        timelineTier: formData.timelineTier,
        customExpectedDate: formData.timelineTier === TimelineTier.CUSTOM_DATE ? new Date(formData.customExpectedDate) : undefined,
        attachmentIds: uploadedFiles.map((f) => f.id),
      };

      const result = await createProjectAction(projectInput);
      router.push(`/projects/${result.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create project");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Wizard Progress Steps Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 border ${
                  step === s
                    ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-900/40 scale-110"
                    : step > s
                    ? "bg-violet-950/40 text-violet-400 border-violet-800"
                    : "bg-zinc-900 text-zinc-500 border-zinc-800"
                }`}
              >
                {step > s ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 flex-1 mx-4 transition-all duration-300 ${
                    step > s ? "bg-violet-600" : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-medium text-zinc-500 mt-2 px-1">
          <span>Category</span>
          <span className="mr-8">Details</span>
          <span className="mr-2">Budget & Timeline</span>
          <span>Review</span>
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Select Project Category</h2>
            <p className="text-sm text-zinc-400">Choose the type of service you need, or select 'Other' for custom work</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service.id)}
                className={`p-6 text-left rounded-xl border transition-all duration-200 cursor-pointer ${
                  formData.serviceId === service.id
                    ? "bg-violet-950/20 border-violet-500 shadow-md shadow-violet-950/30"
                    : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${formData.serviceId === service.id ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-zinc-200">{service.name}</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{service.description}</p>
              </button>
            ))}

            <button
              onClick={() => handleServiceSelect("other")}
              className={`p-6 text-left rounded-xl border transition-all duration-200 cursor-pointer ${
                formData.serviceId === "other"
                  ? "bg-violet-950/20 border-violet-500 shadow-md shadow-violet-950/30"
                  : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg ${formData.serviceId === "other" ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="font-bold text-zinc-200">Other / Custom Service</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">Need something not listed? Select this and describe it in the next step.</p>
            </button>
          </div>

          {formData.serviceId === "other" && (
            <div className="pt-4 animate-fadeIn">
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Specify Service Name
              </label>
              <input
                type="text"
                name="customServiceText"
                value={formData.customServiceText}
                onChange={handleInputChange}
                placeholder="e.g. SEO Audit, Motion Graphics Video"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all"
              />
            </div>
          )}
        </div>
      )}

      {/* STEP 2: PROJECT DETAILS */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Project Requirements</h2>
            <p className="text-sm text-zinc-400">Describe what you need in detail. Upload briefs, brand guides, or wireframes.</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Project Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Redesign FAMX marketing website"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Description / Objectives
              </label>
              <textarea
                name="description"
                rows={5}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what we are building, who the audience is, and the ultimate goals."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Additional Requirements (Optional)
              </label>
              <textarea
                name="requirements"
                rows={3}
                value={formData.requirements}
                onChange={handleInputChange}
                placeholder="Technical specifications, features, color guidelines, fonts, integration requests, etc."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all resize-none"
              />
            </div>

            {/* File Upload Zone */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Attachments (PDF, images, brand guidelines)
              </label>
              <div className="border border-dashed border-zinc-800 hover:border-zinc-700 rounded-xl p-6 bg-zinc-900/30 text-center flex flex-col items-center justify-center relative cursor-pointer group">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />
                <div className="p-3 bg-zinc-800/50 rounded-full text-zinc-400 group-hover:text-zinc-200 transition-colors mb-3">
                  {isUploading ? (
                    <span className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin block" />
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-semibold text-zinc-300">Click to upload file</p>
                <p className="text-xs text-zinc-500 mt-1">PDF, DOCX, PNG, JPG up to 10MB</p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
                      <div className="flex items-center space-x-2.5 truncate">
                        <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-zinc-300 font-medium truncate">{file.fileName}</span>
                        <span className="text-zinc-500 text-[10px]">({(file.sizeBytes / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: BUDGET & TIMELINE */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Budget & Timeline</h2>
            <p className="text-sm text-zinc-400">Specify your non-binding proposed budget and desired delivery timeline tier.</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Proposed Budget (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-zinc-400 font-semibold">$</span>
                <input
                  type="number"
                  name="proposedBudget"
                  value={formData.proposedBudget}
                  onChange={handleInputChange}
                  placeholder="2500"
                  min="1"
                  step="0.01"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl pl-8 pr-4 py-3 text-sm text-zinc-200 outline-none transition-all"
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">This budget is non-binding and acts as a baseline proposal. Admin will issue a final quote.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                Expected Timeline
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { tier: TimelineTier.INSTANT, label: "Instant / Rush", desc: "ASAP (extra rush pricing may apply)" },
                  { tier: TimelineTier.WITHIN_WEEK, label: "Within a Week", desc: "Completion within 5 to 7 days" },
                  { tier: TimelineTier.WITHIN_MONTH, label: "Within a Month", desc: "Completion within 30 days" },
                  { tier: TimelineTier.CUSTOM_DATE, label: "Custom Target Date", desc: "Select a specific future date" },
                ].map((item) => (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, timelineTier: item.tier }))}
                    className={`p-4 text-left rounded-xl border transition-all duration-200 cursor-pointer ${
                      formData.timelineTier === item.tier
                        ? "bg-violet-950/20 border-violet-500"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <h4 className="font-bold text-sm text-zinc-200">{item.label}</h4>
                    <p className="text-[10px] text-zinc-500 mt-1">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {formData.timelineTier === TimelineTier.CUSTOM_DATE && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Choose Target Delivery Date
                </label>
                <input
                  type="date"
                  name="customExpectedDate"
                  value={formData.customExpectedDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-zinc-900 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Review & Submit</h2>
            <p className="text-sm text-zinc-400">Please verify your details before submitting your request to our team.</p>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Service Type</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">
                  {formData.serviceId === "other"
                    ? `Other (${formData.customServiceText})`
                    : services.find((s) => s.id === formData.serviceId)?.name}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Proposed Budget</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">
                  ${parseFloat(formData.proposedBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Project Title</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">{formData.title}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Description</p>
                <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap leading-relaxed">{formData.description}</p>
              </div>
              {formData.requirements && (
                <div className="col-span-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Additional Specs</p>
                  <p className="text-xs text-zinc-400 mt-1 whitespace-pre-wrap leading-relaxed">{formData.requirements}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Timeline Tier</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">
                  {formData.timelineTier === TimelineTier.INSTANT
                    ? "Instant / Rush"
                    : formData.timelineTier === TimelineTier.WITHIN_WEEK
                    ? "Within a Week"
                    : formData.timelineTier === TimelineTier.WITHIN_MONTH
                    ? "Within a Month"
                    : `Custom Date (${formData.customExpectedDate})`}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Attached Files</p>
                <p className="text-sm font-semibold text-zinc-200 mt-1">
                  {uploadedFiles.length === 0 ? "None" : `${uploadedFiles.length} file(s) uploaded`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buttons Navigation bar */}
      <div className="flex justify-between items-center mt-10 pt-6 border-t border-zinc-900">
        {step > 1 ? (
          <button
            onClick={prevStep}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium border border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={nextStep}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition-colors cursor-pointer"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
