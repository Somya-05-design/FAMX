"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { portfolioItems } from "@/lib/content/portfolio";

export function PortfolioGrid() {
  const [activeCategory, setActiveCategory] = useState<string>("All Project");
  const [activeTappedId, setActiveTappedId] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  useEffect(() => {
    // Detect touch capability
    setIsTouchDevice(
      "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
    );
  }, []);

  useEffect(() => {
    if (!isTouchDevice) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".portfolio-card")) {
        setActiveTappedId(null);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isTouchDevice]);

  const categories = ["All Project", "Web Development", "UI/UX Design", "Graphic Design"];

  const filteredItems = activeCategory === "All Project" || activeCategory === "All"
    ? portfolioItems
    : portfolioItems.filter(item => {
        if (activeCategory === "UI/UX Design") return (item.category as string) === "UI/UX" || (item.category as string) === "UI/UX Design";
        return item.category === activeCategory;
      });

  const getBentoColSpan = (index: number) => {
    const idx = index % 6;
    if (idx === 0) return "md:col-span-7";
    if (idx === 1) return "md:col-span-5";
    if (idx === 2) return "md:col-span-5";
    if (idx === 3) return "md:col-span-7";
    if (idx === 4) return "md:col-span-6";
    return "md:col-span-6";
  };

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
              onClick={() => {
                setActiveCategory(category);
                setActiveTappedId(null); // Clear active card on category switch
              }}
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

      {/* Selected Work Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {filteredItems.map((item, index) => {
          const isCardActive = activeTappedId === item.id;
          return (
            <div
              key={item.id}
              onClick={(e) => {
                if (isTouchDevice) {
                  e.stopPropagation();
                  setActiveTappedId(isCardActive ? null : item.id);
                }
              }}
              className={`portfolio-card group relative h-96 overflow-hidden rounded-xl border border-outline-variant transition-all duration-300 ${getBentoColSpan(
                index
              )} cursor-pointer`}
            >
              {/* Default State: Image fills the card */}
              <img
                src={item.image}
                alt={item.title}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isCardActive ? "blur-[10px] scale-105" : "group-hover:blur-[10px] group-hover:scale-105"
                }`}
              />

              {/* Scrim for default title legibility */}
              <div
                className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${
                  isCardActive ? "opacity-0" : "group-hover:opacity-0"
                }`}
              />

              {/* Default Bottom Project Title Label */}
              <div
                className={`absolute bottom-4 left-4 right-4 z-10 space-y-1.5 transition-all duration-300 pointer-events-none ${
                  isCardActive
                    ? "opacity-0 translate-y-2"
                    : "opacity-100 translate-y-0 group-hover:opacity-0 group-hover:translate-y-2"
                }`}
              />
              {/* Actually render label content safely */}
              <div
                className={`absolute bottom-5 left-5 right-5 z-10 flex flex-col items-start gap-1.5 transition-all duration-300 pointer-events-none ${
                  isCardActive
                    ? "opacity-0 translate-y-2"
                    : "opacity-100 translate-y-0 group-hover:opacity-0 group-hover:translate-y-2"
                }`}
              >
                <span className={`inline-block text-[9px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider border shadow-xs ${getCategoryTagStyle()}`}>
                  {item.category === "UI/UX" ? "UI/UX DESIGN" : item.category.toUpperCase()}
                </span>
                <h4 className="text-base font-extrabold text-white tracking-tight drop-shadow-md">
                  {item.title}
                </h4>
              </div>

              {/* Hover / Tap State Overlay (Fades in) */}
              <div
                className={`absolute inset-0 bg-black/75 transition-opacity duration-300 flex flex-col justify-between p-6 z-20 ${
                  isCardActive
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-[var(--on-primary-container)]">
                      {item.category}
                    </span>
                    <h4 className="text-lg font-black text-white tracking-tight">
                      {item.title}
                    </h4>
                  </div>

                  <div className="space-y-3.5 pt-2 border-t border-white/10">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--on-primary-container)]">
                        Brief:
                      </span>
                      <p className="text-xs font-semibold text-white/95 leading-relaxed">
                        {item.requirement}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--on-primary-container)]">
                        Delivered:
                      </span>
                      <p className="text-xs font-semibold text-white/85 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Info & Link */}
                <div className="pt-3 border-t border-white/10 flex justify-between items-center mt-4">
                  <div className="flex items-center gap-1 text-[11px] text-white/70 italic font-medium truncate max-w-[60%]">
                    <span>⚡</span>
                    <span className="truncate">{item.result}</span>
                  </div>
                  <Link
                    href={`/signup?next=/projects/new&work=${item.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-primary hover:bg-primary-container text-on-primary text-[10px] font-bold px-3 py-1.5 rounded-full transition-transform hover:scale-105 flex items-center gap-1 shadow-xs cursor-pointer shrink-0"
                  >
                    <span>Request Info</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
