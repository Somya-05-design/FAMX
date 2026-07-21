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
    <div className="flex min-h-screen bg-[#FDF9F7] text-zinc-900 selection:bg-indigo-100">
      {/* Sidebar Navigation */}
      <Sidebar user={session.user} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#FDF9F7]">
        {/* Top Header Navbar */}
        <header className="h-16 border-b border-zinc-200/60 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-[#FDF9F7]">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            PORTAL / CLIENT CONSOLE
          </div>
          <div className="flex items-center space-x-4">
            <NotificationBell userId={session.user.id} />
          </div>
        </header>

        <div className="flex-1 p-6 sm:p-10 max-w-7xl w-full mx-auto flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>

          {/* Authenticated Page Footer matching reference */}
          <footer className="mt-16 pt-6 border-t border-zinc-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-zinc-900 tracking-tight">FAMX</span>
              <span>© 2026 FAMX. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-zinc-900 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-zinc-900 transition-colors">Contact</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
