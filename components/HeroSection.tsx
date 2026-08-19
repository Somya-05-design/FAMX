"use client";

import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative pt-6 pb-16 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">

      {/* 1. Floating Centered Pill Navbar */}
      <div className="flex justify-center mb-12 sm:mb-16">
        <header className="inline-flex items-center space-x-6 sm:space-x-8 bg-surface-container-lowest border border-outline-variant rounded-full px-5 sm:px-7 py-3 transition-all">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-xs bg-white flex items-center justify-center">
              <svg viewBox="0 0 1040 580" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="hgF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1565C0" />
                    <stop offset="100%" stopColor="#0D47A1" />
                  </linearGradient>
                  <linearGradient id="hgX" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0288D1" />
                    <stop offset="100%" stopColor="#01579B" />
                  </linearGradient>
                  <linearGradient id="hgSwoop" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#29B6F6" />
                    <stop offset="100%" stopColor="#0277BD" />
                  </linearGradient>
                </defs>
                <g fill="#1a3a7a" opacity="0.85">
                  <rect x="60" y="270" width="18" height="18" /><rect x="85" y="255" width="14" height="14" />
                  <rect x="110" y="262" width="14" height="14" /><rect x="135" y="270" width="16" height="16" />
                  <rect x="162" y="275" width="18" height="18" /><rect x="190" y="282" width="20" height="20" />
                </g>
                <path d="M230 120 L230 460 L295 460 L295 320 L430 320 L430 265 L295 265 L295 175 L460 175 L460 120 Z" fill="url(#hgF)" />
                <polygon points="280,460 340,460 490,120 430,120" fill="#1976D2" opacity="0.55" />
                <polygon points="480,120 560,120 680,290 600,290" fill="url(#hgX)" />
                <polygon points="480,460 560,460 680,290 600,290" fill="#1a3a7a" opacity="0.8" />
                <polygon points="760,120 840,120 680,290 600,290" fill="#1a3a7a" opacity="0.7" />
                <polygon points="760,460 840,460 680,290 600,290" fill="url(#hgX)" />
                <path d="M350 80 Q600 -30 820 180 Q950 280 820 420 Q750 480 660 460" fill="none" stroke="url(#hgSwoop)" strokeWidth="28" strokeLinecap="round" opacity="0.9" />
                <path d="M350 80 Q600 -30 820 180 Q950 280 820 420 Q750 480 660 460" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" opacity="0.35" />
              </svg>
            </div>
            <span className="text-base font-black tracking-tight text-on-surface">
              FAMX
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-on-surface-variant">
            <a href="#services" className="hover:text-on-surface transition-colors flex items-center space-x-1">
              <span>Solutions</span>
              <svg className="w-3 h-3 text-outline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#work" className="hover:text-on-surface transition-colors">Work</a>
            <a href="#how-it-works" className="hover:text-on-surface transition-colors">Process</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold text-on-surface-variant hover:text-on-surface px-4 py-2 border border-outline-variant hover:border-outline rounded-full transition-all shadow-xs"
            >
              Sign in
            </Link>
            <a
              href="#contact"
              className="bg-primary hover:bg-primary-container text-on-primary text-xs font-bold px-4.5 py-2 rounded-full transition-all duration-200 shadow-xs cursor-pointer"
            >
              Contact
            </a>
          </div>
        </header>
      </div>

      {/* 2. Rebuilt Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center text-left">
        {/* Left Column: Copy & Actions */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center space-x-2 bg-surface-container-high/60 border border-outline-variant/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Product Engineering & Brand Design Studio</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-on-surface leading-[1.1]">
            We design and build <br />
            premium <em className="italic text-primary font-serif font-normal lowercase">digital</em> products
          </h1>

          {/* Subheading */}
          <p className="text-body-md sm:text-body-lg text-on-surface-variant max-w-lg leading-relaxed font-semibold">
            Product Engineering & Brand Design Group to make your Product more Effective
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup?next=/projects/new"
              className="bg-primary hover:bg-primary/95 text-on-primary font-bold px-6 py-3.5 rounded-xl text-xs transition-all duration-200 flex items-center space-x-1.5"
            >
              <span>Start Now</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <a
              href="#work"
              className="border border-outline-variant hover:border-outline text-on-surface font-bold px-6 py-3.5 rounded-xl text-xs transition-all duration-200"
            >
              See our Work
            </a>
          </div>

          {/* Stat Row */}
          <div className="pt-6 sm:pt-8 border-t border-outline-variant/40 grid grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-on-surface">
                1200+
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-tight">
                Products Delivered
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-on-surface">
                98%
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-tight">
                Positive Review
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl sm:text-3xl font-black text-on-surface">
                40+
              </div>
              <div className="text-[10px] sm:text-xs font-bold text-on-surface-variant uppercase tracking-wider leading-tight">
                Clients Covered
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Illustration Panel */}
        <div className="lg:col-span-5 relative flex items-center justify-center">
          <div className="w-full relative max-w-md sm:max-w-lg aspect-square bg-surface-container-low rounded-3xl p-4 sm:p-6 border border-outline-variant/50 overflow-visible flex items-center justify-center">
            <img
              src="/hero/collaboration.jpg"
              alt="Product Collaboration Illustration"
              className="w-full h-full object-cover rounded-2xl"
            />

            {/* Floating Callout Card */}
            <div className="absolute -top-4 right-2 sm:-top-6 sm:right-6 bg-surface-container-lowest border border-outline-variant p-3 sm:p-4 rounded-2xl shadow-md max-w-[220px] sm:max-w-[250px] flex items-start space-x-3 z-20 transition-all duration-300 hover:scale-105">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-extrabold text-on-surface leading-tight">
                  Your Project is Under Process
                </p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-0.5 leading-tight">
                  Design phase Going
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
