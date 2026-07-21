import { getActiveServices } from "@/lib/data/services";
import { NewProjectWizard } from "@/components/NewProjectWizard";

export default async function NewProjectPage() {
  const services = await getActiveServices();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Create a New Project</h1>
        <p className="text-sm text-zinc-500 mt-1">Submit your project brief and proposed budget. Our team will review it and issue a quote.</p>
      </div>

      <div className="bg-white border border-zinc-200/80 p-8 rounded-2xl shadow-xs">
        <NewProjectWizard services={services} />
      </div>
    </div>
  );
}
