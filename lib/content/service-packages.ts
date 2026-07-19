export interface ServicePackage {
  id: string;
  name: string;
  category: "Web Development" | "Graphic Design" | "UI/UX" | "Custom Request";
  description: string;
  requirements: string;
  indicativePrice: string;
  deliveryTimeframe: string;
}

export const servicePackages: ServicePackage[] = [
  {
    id: "business-website",
    name: "Business Website",
    category: "Web Development",
    description: "A professional, fast, and SEO-optimized website to represent your business or brand online.",
    requirements: "Company profile, logo, brand assets, copywriting, and page outline.",
    indicativePrice: "Starting from $1,200",
    deliveryTimeframe: "7-14 days",
  },
  {
    id: "e-commerce",
    name: "E-commerce Platform",
    category: "Web Development",
    description: "Fully featured online store equipped with payment gateway integration, cart, and inventory management.",
    requirements: "Product list, pricing, high-quality product images, shipping parameters, Stripe/PayPal credentials.",
    indicativePrice: "Starting from $2,500",
    deliveryTimeframe: "14-21 days",
  },
  {
    id: "web-app",
    name: "Custom Web Application",
    category: "Web Development",
    description: "Tailor-made cloud platform or SaaS MVP built with React, Next.js, and modern backends.",
    requirements: "Detailed product spec document, user flows, database design hints, and API specifications (if any).",
    indicativePrice: "Starting from $5,000",
    deliveryTimeframe: "30-45 days",
  },
  {
    id: "mobile-app",
    name: "Mobile Application",
    category: "Web Development",
    description: "Cross-platform iOS and Android mobile app designed for App Store and Google Play publication.",
    requirements: "Figma designs, feature list, push notification requirements, third-party integration specs.",
    indicativePrice: "Starting from $7,500",
    deliveryTimeframe: "45-60 days",
  },
  {
    id: "brand-identity",
    name: "Brand Identity Suite",
    category: "Graphic Design",
    description: "Complete visual guidelines including color palette, typography selection, and brand application rules.",
    requirements: "Company values, mission statement, target audience profile, style preferences.",
    indicativePrice: "Starting from $800",
    deliveryTimeframe: "7-10 days",
  },
  {
    id: "logo-design",
    name: "Custom Logo Design",
    category: "Graphic Design",
    description: "Distinctive, high-resolution vector logo concepts with multiple revisions and format exports.",
    requirements: "Brand name, tagline, color preferences, reference logos, or moodboard.",
    indicativePrice: "Starting from $350",
    deliveryTimeframe: "3-5 days",
  },
  {
    id: "social-media-kit",
    name: "Social Media Kit",
    category: "Graphic Design",
    description: "Custom banners, post templates, and profile graphic assets for LinkedIn, Twitter, Instagram, and Facebook.",
    requirements: "Approved logo, brand colors, typography guidelines, copy templates.",
    indicativePrice: "Starting from $250",
    deliveryTimeframe: "3-4 days",
  },
];
