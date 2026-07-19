"use client";

import { useState } from "react";
import { portfolioItems, PortfolioItem } from "@/lib/content/portfolio";

export function PortfolioGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", "Web Development", "Graphic Design", "UI/UX"];

  const filteredItems = activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter(item => item.category === activeCategory);

  return (
    <div className="space-y-12">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 cursor-pointer ${
              activeCategory === category
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow-md shadow-indigo-950/40"
                : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Selected Work Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="group relative flex flex-col justify-between overflow-hidden bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 transition-all duration-300 hover:border-zinc-700/80 hover:shadow-xl hover:shadow-violet-950/5"
          >
            {/* Visual Header / Premium Gradient Background */}
            <div className={`h-40 w-full bg-gradient-to-br ${item.gradient} rounded-xl mb-6 relative overflow-hidden flex items-center justify-center p-4`}>
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] transition-all duration-300 group-hover:backdrop-blur-none group-hover:bg-black/0" />
              <span className="relative z-10 text-white font-extrabold tracking-wider text-sm select-none opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 uppercase">
                {item.title}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold border border-zinc-800 bg-zinc-900 text-zinc-400">
                    {item.category}
                  </span>
                </div>
                <h4 className="text-base font-bold text-zinc-100 group-hover:text-violet-400 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Showcase Key Result metric */}
              <div className="pt-4 border-t border-zinc-900/60 flex items-start space-x-2">
                <span className="text-violet-400 text-xs font-bold font-mono">⚡</span>
                <span className="text-[11px] text-zinc-500 font-medium italic">
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
