"use client";

import Link from "next/link";

interface ChipProps {
  style: "dark-icon" | "avatar" | "muted-icon" | "solid-square";
  positionClass: string;
  avatarText?: string;
  gradient?: string;
  icon?: React.ReactNode;
}

function FloatingIconChip({ style, positionClass, avatarText, gradient, icon }: ChipProps) {
  if (style === "solid-square") {
    return (
      <div className={`absolute ${positionClass} w-7 h-7 bg-black rounded-md shadow-md border border-white/60 pointer-events-none z-10 transition-transform duration-500 hover:scale-110`} />
    );
  }

  if (style === "avatar") {
    return (
      <div className={`absolute ${positionClass} w-10 h-10 rounded-xl bg-white p-0.5 border border-zinc-200 shadow-lg shadow-zinc-950/10 pointer-events-none z-10 transition-transform duration-500 hover:scale-110 flex items-center justify-center`}>
        <div className={`w-full h-full rounded-lg bg-gradient-to-tr ${gradient || "from-indigo-500 to-purple-600"} flex items-center justify-center text-white font-extrabold text-[10px] shadow-inner`}>
          {avatarText || "A"}
        </div>
      </div>
    );
  }

  if (style === "muted-icon") {
    return (
      <div className={`absolute ${positionClass} w-10 h-10 rounded-xl bg-zinc-100/90 border border-zinc-200 shadow-md shadow-zinc-950/5 pointer-events-none z-10 flex items-center justify-center text-zinc-500 transition-transform duration-500 hover:scale-110`}>
        {icon || (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        )}
      </div>
    );
  }

  // dark-icon default
  return (
    <div className={`absolute ${positionClass} w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg shadow-zinc-950/20 pointer-events-none z-10 flex items-center justify-center text-white transition-transform duration-500 hover:scale-110`}>
      {icon || (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      )}
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

        {/* 3. Floating Icon Chips (8 Total, Organcally Positioned Around Mid/Outer Rings) */}
        {/* #1 Upper-Left */}
        <FloatingIconChip
          style="dark-icon"
          positionClass="top-[2%] left-[10%] sm:left-[16%]"
          icon={
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12 12 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          }
        />

        {/* #2 Upper-Right */}
        <FloatingIconChip
          style="avatar"
          positionClass="top-[4%] right-[10%] sm:right-[15%]"
          avatarText="JD"
          gradient="from-blue-500 to-indigo-600"
        />

        {/* #3 Left (Mid height) */}
        <FloatingIconChip
          style="avatar"
          positionClass="top-[38%] -left-[2%] sm:left-[2%]"
          avatarText="MK"
          gradient="from-emerald-500 to-teal-600"
        />

        {/* #4 Right (Mid height) */}
        <FloatingIconChip
          style="dark-icon"
          positionClass="top-[36%] -right-[2%] sm:right-[3%]"
          icon={
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          }
        />

        {/* #5 Far Left (Mid height solid square) */}
        <FloatingIconChip
          style="solid-square"
          positionClass="top-[55%] left-[6%] sm:left-[10%]"
        />

        {/* #6 Far Right (Light/muted icon) */}
        <FloatingIconChip
          style="muted-icon"
          positionClass="top-[58%] right-[7%] sm:right-[11%]"
          icon={
            <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          }
        />

        {/* #7 Lower-Left */}
        <FloatingIconChip
          style="avatar"
          positionClass="bottom-[8%] left-[12%] sm:left-[18%]"
          avatarText="SL"
          gradient="from-purple-500 to-pink-600"
        />

        {/* #8 Lower-Right */}
        <FloatingIconChip
          style="avatar"
          positionClass="bottom-[10%] right-[12%] sm:right-[17%]"
          avatarText="AR"
          gradient="from-amber-500 to-rose-600"
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
