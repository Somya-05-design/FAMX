"use client";

import { useState } from "react";
import Link from "next/link";
import { portfolioItems } from "@/lib/content/portfolio";

export function PortfolioGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All Project");

  const categories = ["All Project", "Web Development", "UI/UX Design", "Graphic Design"];

  const filteredItems = activeCategory === "All Project" || activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter(item => {
        if (activeCategory === "UI/UX Design") return (item.category as string) === "UI/UX" || (item.category as string) === "UI/UX Design";
        return item.category === activeCategory;
      });

  const getCategoryTagStyle = () => {
    return "text-on-surface-variant bg-surface-container-high border-outline-variant";
  };

  return (
    <div className="space-y-12">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => {
          const isActive = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* Selected Work Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between overflow-hidden bg-surface-container-lowest border border-outline-variant rounded-3xl p-5 transition-all duration-300 hover:border-primary"
          >
            {/* Showcase Image Container with Overlay, Blur & Redirect Button */}
            <div className="h-56 w-full bg-surface-container-highest rounded-2xl relative overflow-hidden border border-outline-variant">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 group-hover:blur-xs transition-all duration-500"
              />

              {/* Gradient Dark Bottom Mask */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-30" />

              {/* Title & Category Pill on Image (Visible by default) */}
              <div className="absolute bottom-4 left-4 right-4 z-10 space-y-1.5 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2">
                <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-xs ${getCategoryTagStyle()}`}>
                  {item.category === "UI/UX" ? "UI/UX DESIGN" : item.category.toUpperCase()}
                </span>
                <h4 className="text-base font-extrabold text-white tracking-tight drop-shadow-md">
                  {item.title}
                </h4>
              </div>

              {/* Hover Blur Overlay + Redirect Action Button */}
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px]">
                <h4 className="text-sm font-extrabold text-white text-center mb-3 tracking-tight">
                  {item.title}
                </h4>
                <Link
                  href={`/signup?next=/projects/new&work=${item.id}`}
                  className="bg-primary hover:bg-primary-container text-on-primary font-extrabold text-xs px-5 py-2.5 rounded-full shadow-xs transition-transform duration-200 hover:scale-105 flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>View Details</span>
                  <svg className="w-3.5 h-3.5 text-on-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Showcase Key Result metric */}
            <div className="pt-3.5 mt-3 border-t border-outline-variant/40 flex items-center space-x-2">
              <span className="text-primary text-xs font-bold">⚡</span>
              <span className="text-[11px] text-on-surface-variant font-semibold italic truncate">
                {item.result}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
