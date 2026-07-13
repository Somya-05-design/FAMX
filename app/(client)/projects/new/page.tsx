import { getActiveServices } from "@/lib/data/services";
import { NewProjectWizard } from "@/components/NewProjectWizard";

export default async function NewProjectPage() {
  const services = await getActiveServices();

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Create a New Project</h1>
        <p className="text-sm text-zinc-400 mt-1">Submit your project brief and proposed budget. Our team will review it and issue a quote.</p>
      </div>

      <div className="bg-zinc-900/20 border border-zinc-800/80 p-8 rounded-2xl">
        <NewProjectWizard services={services} />
      </div>
    </div>
  );
}
