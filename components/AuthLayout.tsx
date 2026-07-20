import React from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex bg-white text-zinc-900 font-sans antialiased overflow-hidden">
      {/* Left Panel - Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16 min-h-screen z-10 bg-white">
        {/* Top Branding Header */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4-6.3-4.6-6.3 4.6 2.3-7.4-6-4.6h7.6z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-zinc-900 tracking-tight">Famx</span>
          </Link>
        </div>

        {/* Center Main Form Column */}
        <div className="w-full max-w-[420px] mx-auto py-8 sm:py-12">
          {children}
        </div>

        {/* Footer spacer */}
        <div className="hidden sm:block text-xs text-zinc-400">
        </div>
      </div>

      {/* Right Panel - Decorative Blue Artwork (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen bg-[#070b19] overflow-hidden items-center justify-center">
        {/* Rich Abstract Blue Liquid Artwork SVG */}
        <svg
          className="absolute inset-0 w-full h-full object-cover"
          preserveAspectRatio="none"
          viewBox="0 0 800 1000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#040817" />
              <stop offset="50%" stopColor="#0a1847" />
              <stop offset="100%" stopColor="#06102b" />
            </linearGradient>

            <linearGradient id="swirl1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="swirl2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="60%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="25" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background fill */}
          <rect width="800" height="1000" fill="url(#bgGrad)" />

          {/* Swirling 3D-like ribbon shapes matching the reference artwork */}
          <path
            d="M 150 -100 C 400 150, 750 300, 600 600 C 450 900, 100 850, 300 1100 L 900 1100 L 900 -100 Z"
            fill="url(#swirl1)"
            opacity="0.85"
            filter="url(#glow)"
          />

          <path
            d="M 350 -100 C 600 200, 850 450, 700 750 C 550 1050, 250 900, 450 1100 L 900 1100 L 900 -100 Z"
            fill="url(#swirl2)"
            opacity="0.75"
          />

          <path
            d="M -50 200 C 250 350, 500 100, 750 400 C 1000 700, 650 1050, 900 1200"
            stroke="#93c5fd"
            strokeWidth="35"
            strokeLinecap="round"
            opacity="0.3"
            filter="url(#glow)"
          />

          <path
            d="M 200 0 Q 550 400 350 800 T 700 1100"
            stroke="#3b82f6"
            strokeWidth="60"
            strokeLinecap="round"
            opacity="0.4"
          />

          {/* Overlay highlight glow */}
          <circle cx="650" cy="300" r="300" fill="#3b82f6" opacity="0.2" filter="url(#glow)" />
        </svg>

        {/* Legal Text Disclaimer Overlay Card in Bottom Right */}
        <div className="absolute bottom-10 right-10 max-w-[360px] p-5 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 text-white/90 shadow-2xl z-20">
          <p className="text-[11px] font-semibold text-center tracking-wide text-white/90 mb-1.5">
            © 2026 FAMX. All rights reserved.
          </p>
          <p className="text-[10px] leading-relaxed text-white/70 text-center">
            Unauthorized use or reproduction of any content or materials from this site is strictly prohibited. For more information, visit our <Link href="#" className="underline hover:text-white">Terms of Service</Link> and <Link href="#" className="underline hover:text-white">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
