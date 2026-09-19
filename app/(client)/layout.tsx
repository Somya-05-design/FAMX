import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

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
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-background selection:bg-primary/20">
      {/* Sidebar Navigation */}
      <Sidebar user={session.user} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen md:h-screen overflow-y-auto bg-background">
        {/* Top Header Navbar */}
        <header className="hidden md:flex sticky top-0 z-40 h-16 border-b border-outline-variant/40 px-6 sm:px-10 items-center justify-between shrink-0 bg-background/80 backdrop-blur-md">
          <div className="text-[11px] font-semibold text-outline uppercase tracking-wider">
            PORTAL / CLIENT CONSOLE
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-10 max-w-7xl w-full mx-auto flex flex-col justify-between">
          <div className="flex-1">
            {children}
          </div>

          {/* Authenticated Page Footer matching reference */}
          <footer className="mt-16 pt-6 border-t border-outline-variant/40 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-on-surface tracking-tight">FAMX</span>
              <span>© 2026 FAMX. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#" className="hover:text-on-surface transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-on-surface transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-on-surface transition-colors">Contact</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
