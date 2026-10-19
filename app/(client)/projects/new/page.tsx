import { getActiveServices } from "@/lib/data/services";
import { NewProjectWizard } from "@/components/NewProjectWizard";

export default async function NewProjectPage() {
  const services = await getActiveServices();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">Create a New Project</h1>
        <p className="text-xs sm:text-sm font-medium text-on-surface-variant mt-1">Submit your project brief and proposed budget. Our team will review it and issue a quote.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-2xl shadow-xs">
        <NewProjectWizard services={services} />
      </div>
    </div>
  );
}
