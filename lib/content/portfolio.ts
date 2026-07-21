export interface PortfolioItem {
  id: string;
  title: string;
  category: "Web Development" | "Graphic Design" | "UI/UX" | "Custom Request";
  description: string;
  image: string;
  gradient: string; // Vibrant gradient classes to render visually premium cards
  result: string;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: "nova-saas",
    title: "Nova Analytics Platform",
    category: "Web Development",
    description: "A high-performance real-time SaaS dashboard for enterprise traffic analysis and predictive modeling.",
    image: "/work/work1.png",
    gradient: "from-violet-600 via-indigo-600 to-cyan-500",
    result: "Boosted user engagement by 40% with instant data loading.",
  },
  {
    id: "apex-identity",
    title: "Apex Ventures Brand",
    category: "Graphic Design",
    description: "Complete visual redesign, custom wordmark, brand guidelines, and stationary assets for a venture capital firm.",
    image: "/work/work2.png",
    gradient: "from-amber-500 via-orange-600 to-rose-500",
    result: "Redefined brand identity implemented across 12 portfolio companies.",
  },
  {
    id: "quantum-crypto",
    title: "Quantum DeFi Protocol",
    category: "UI/UX",
    description: "Mobile-first UI design and component system for a decentralized finance wallet and swap interface.",
    image: "/work/work3.png",
    gradient: "from-emerald-500 via-teal-600 to-indigo-600",
    result: "Simplified complex transaction flows to lower client drop-off rate by 25%.",
  },
  {
    id: "zenith-commerce",
    title: "Zenith Retail E-shop",
    category: "Web Development",
    description: "A headless Shopify integration utilizing Next.js for blazing fast load speeds and customized checkout flows.",
    image: "/work/work4.png",
    gradient: "from-fuchsia-600 via-pink-600 to-rose-500",
    result: "Increased mobile conversion rate by 18% post-launch.",
  },
  {
    id: "stellar-design-system",
    title: "Stellar Enterprise UI",
    category: "UI/UX",
    description: "Design tokens and accessible component library designed in Figma and coded in React for an online learning hub.",
    image: "/work/work5.png",
    gradient: "from-blue-600 via-indigo-600 to-violet-500",
    result: "Decreased frontend development turnaround time by 50% across teams.",
  },
  {
    id: "pulse-marketing",
    title: "Pulse Content Pack",
    category: "Graphic Design",
    description: "A comprehensive social media asset library, presentation decks, and video templates for product marketing campaigns.",
    image: "/work/work6.png",
    gradient: "from-rose-500 via-purple-600 to-blue-600",
    result: "Drove 120k+ impressions over a 2-week launch window.",
  },
];
