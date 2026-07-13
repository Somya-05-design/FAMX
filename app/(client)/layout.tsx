import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "CLIENT") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-900 text-zinc-100">
      {/* Sidebar Navigation */}
      <Sidebar user={session.user} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-zinc-950">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-zinc-900/60 px-8 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
            Portal / Client Console
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell userId={session.user.id} />
          </div>
        </header>

        <div className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
