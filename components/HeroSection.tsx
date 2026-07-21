"use client";

import Link from "next/link";

interface ImageBoxProps {
  src: string;
  alt: string;
  positionClass: string;
  sizeClass?: string;
}

function FloatingImageBox({ src, alt, positionClass, sizeClass = "w-12 h-12 sm:w-14 sm:h-14" }: ImageBoxProps) {
  return (
    <div className={`absolute ${positionClass} ${sizeClass} p-1 bg-white rounded-2xl border border-zinc-200/90 shadow-xl shadow-zinc-950/10 pointer-events-none z-10 transition-transform duration-500 hover:scale-110 flex items-center justify-center`}>
      <div className="w-full h-full rounded-xl overflow-hidden bg-zinc-100 relative">
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative pt-6 pb-16 text-center overflow-hidden max-w-7xl mx-auto px-4 sm:px-6">

      {/* 1. Floating Centered Pill Navbar */}
      <div className="flex justify-center mb-12 sm:mb-16">
        <header className="inline-flex items-center space-x-6 sm:space-x-8 bg-white border border-zinc-200/80 rounded-full px-5 sm:px-7 py-3 shadow-xl shadow-zinc-950/5 transition-all">

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 shrink-0">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm">
              ⊕
            </div>
            <span className="text-base font-black tracking-tight text-zinc-900">
              FAMX
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-6 text-xs font-bold text-zinc-600">
            <a href="#services" className="hover:text-zinc-900 transition-colors flex items-center space-x-1">
              <span>Solutions</span>
              <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </a>
            <a href="#work" className="hover:text-zinc-900 transition-colors">Work</a>
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">Process</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <Link
              href="/login"
              className="text-xs font-bold text-zinc-700 hover:text-zinc-900 px-4 py-2 border border-zinc-200 hover:border-zinc-300 rounded-full transition-all shadow-sm"
            >
              Sign in
            </Link>
            <a
              href="#contact"
              className="bg-black hover:bg-zinc-800 text-white text-xs font-bold px-4.5 py-2 rounded-full transition-all duration-200 shadow-sm"
            >
              Contact
            </a>
          </div>
        </header>
      </div>

      {/* Hero Visual Container */}
      <div className="relative py-8 md:py-12 max-w-4xl mx-auto flex flex-col items-center">

        {/* 2. Concentric Ring Background (Bleeds out) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 overflow-visible">
          {/* Ring 4 (Outermost) */}
          <div className="w-[850px] h-[850px] rounded-full border border-zinc-200/50 flex items-center justify-center shrink-0">
            {/* Ring 3 */}
            <div className="w-[650px] h-[650px] rounded-full border border-zinc-200/60 flex items-center justify-center">
              {/* Ring 2 */}
              <div className="w-[470px] h-[470px] rounded-full border border-zinc-200/70 flex items-center justify-center">
                {/* Ring 1 (Innermost) */}
                <div className="w-[300px] h-[300px] rounded-full border border-zinc-200/50" />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Six Floating Image Boxes Organically Positioned Around Background Rings */}
        {/* Box #1: Upper-Left (UI Concept) */}
        <FloatingImageBox
          src="/hero/box1.png"
          alt="UI Concept Preview"
          positionClass="top-[2%] left-[8%] sm:left-[14%]"
          sizeClass="w-12 h-12 sm:w-16 sm:h-16"
        />

        {/* Box #2: Upper-Right (Creative Avatar) */}
        <FloatingImageBox
          src="/hero/box2.png"
          alt="Creative Professional"
          positionClass="top-[4%] right-[8%] sm:right-[13%]"
          sizeClass="w-12 h-12 sm:w-14 sm:h-14"
        />

        {/* Box #3: Mid-Left (Mobile App Interface) */}
        <FloatingImageBox
          src="/hero/box3.png"
          alt="Mobile App Interface"
          positionClass="top-[38%] -left-[2%] sm:left-[2%]"
          sizeClass="w-12 h-12 sm:w-14 sm:h-14"
        />

        {/* Box #4: Mid-Right (3D Abstract Visual) */}
        <FloatingImageBox
          src="/hero/box4.png"
          alt="3D Visual Artwork"
          positionClass="top-[36%] -right-[2%] sm:right-[3%]"
          sizeClass="w-12 h-12 sm:w-16 sm:h-16"
        />



        {/* 4. Trust Row */}
        <div className="inline-flex items-center space-x-2 bg-white/90 border border-zinc-200/80 px-4 py-1.5 rounded-full text-xs font-bold text-zinc-600 shadow-sm mb-6 z-20">
          <span className="flex items-center space-x-1">
            <span className="w-4 h-4 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center text-[10px]">G</span>
            <span><strong className="text-zinc-900">4.6</strong> Google</span>
          </span>
          <span className="text-zinc-300">•</span>
          <span className="flex items-center space-x-1">
            <span className="text-emerald-500 text-xs">★</span>
            <span><strong className="text-zinc-900">4.9</strong> Trustpilot</span>
          </span>
        </div>

        {/* 5. Headline, Subheading, CTAs */}
        <div className="space-y-6 max-w-3xl mx-auto z-20">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-zinc-900 leading-[1.1]">
            We design and build <br />
            premium digital products
          </h1>

          <p className="text-sm sm:text-base text-zinc-500 font-semibold max-w-lg mx-auto leading-relaxed">
            Product Engineering & Brand Design Group
          </p>

          <div className="flex flex-wrap justify-center gap-3.5 pt-2">
            <Link
              href="/signup?next=/projects/new"
              className="bg-black hover:bg-zinc-800 text-white font-bold px-8 py-3.5 rounded-full text-xs transition-all duration-200 shadow-lg shadow-zinc-950/10"
            >
              Get started free
            </Link>
            <a
              href="#work"
              className="bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 font-bold px-8 py-3.5 rounded-full text-xs transition-all duration-200 shadow-sm"
            >
              See Work
            </a>
          </div>
        </div>

        {/* 6. Floating Activity Card Stack */}
        <div className="pt-12 sm:pt-14 w-full max-w-md mx-auto z-20 relative">
          {/* Faded Background Card Peeking Behind */}
          <div className="absolute top-8 left-4 right-4 bg-white/50 border border-zinc-200/50 p-3 rounded-2xl shadow-sm opacity-60 scale-95 transform -translate-y-2 pointer-events-none flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
            <div className="h-3 bg-zinc-200 rounded w-1/2" />
          </div>

          {/* Main Front Activity Card */}
          <div className="relative bg-white border border-zinc-200/90 p-4.5 rounded-2xl shadow-xl shadow-zinc-950/5 flex items-center space-x-3.5 text-left">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-inner">
              CS
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <p className="text-xs font-extrabold text-zinc-900 truncate">Chandni Singh</p>
                <span className="text-[10px] text-zinc-500 font-medium">joined to</span>
                <a href="#work" className="text-xs font-bold text-blue-600 hover:underline truncate">Final Presentation</a>
                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-[10px] text-zinc-400 font-semibold mt-0.5 truncate">
                8 min ago · Onlcreative Dribble
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
