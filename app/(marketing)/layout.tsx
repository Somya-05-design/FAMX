import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAMX | Premium Technical Agency & Product Engineering Group",
  description: "Accelerate your product development. We deliver production-ready software, custom web platforms, mobile applications, and visual brand systems with speed and precision.",
  openGraph: {
    title: "FAMX | Technical Agency & Product Engineering Group",
    description: "Accelerate your product development. We deliver production-ready software, custom web platforms, mobile applications, and visual brand systems with speed and precision.",
    type: "website",
    url: "https://famx.agency",
    siteName: "FAMX Platform",
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-violet-500/30 selection:text-violet-200">
      {children}
    </div>
  );
}
