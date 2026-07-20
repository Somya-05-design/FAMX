"use client";

import { useState } from "react";
import { portfolioItems } from "@/lib/content/portfolio";

export function PortfolioGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All Project");

  const categories = ["All Project", "Web Development", "UI/UX Design", "Graphic Design"];

  const filteredItems = activeCategory === "All Project" || activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter(item => {
        if (activeCategory === "UI/UX Design") return item.category === "UI/UX" || item.category === "UI/UX Design";
        return item.category === activeCategory;
      });

  const getCategoryTagStyle = (cat: string) => {
    if (cat.includes("Web")) return "text-blue-600 bg-blue-50 border-blue-100";
    if (cat.includes("UI") || cat.includes("UX")) return "text-purple-600 bg-purple-50 border-purple-100";
    if (cat.includes("Graphic") || cat.includes("Design")) return "text-rose-600 bg-rose-50 border-rose-100";
    return "text-zinc-600 bg-zinc-100 border-zinc-200";
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
                  ? "bg-black text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
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
            className="group relative flex flex-col justify-between overflow-hidden bg-white border border-zinc-200/80 rounded-3xl p-6 transition-all duration-300 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-950/5"
          >
            {/* Visual Image / Gradient Box */}
            <div className={`h-48 w-full bg-gradient-to-br ${item.gradient} rounded-2xl mb-6 relative overflow-hidden flex items-center justify-center p-4 shadow-inner`}>
              <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px] transition-all duration-300 group-hover:backdrop-blur-none group-hover:bg-black/0" />
              <span className="relative z-10 text-white font-black tracking-wider text-sm select-none opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 uppercase drop-shadow-sm">
                {item.title}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border ${getCategoryTagStyle(item.category)}`}>
                    {item.category === "UI/UX" ? "UI/UX DESIGN" : item.category.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-900 group-hover:text-black transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Showcase Key Result metric */}
              <div className="pt-4 border-t border-zinc-100 flex items-start space-x-2">
                <span className="text-zinc-400 text-xs font-bold">⚡</span>
                <span className="text-[11px] text-zinc-500 font-semibold italic">
                  {item.result}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
