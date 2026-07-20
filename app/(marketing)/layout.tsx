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
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 selection:text-zinc-900">
      {children}
    </div>
  );
}
