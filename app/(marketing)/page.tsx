"use client";

import { useState } from "react";
import Link from "next/link";
import { servicePackages } from "@/lib/content/service-packages";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/components/HeroSection";
import { DotPattern } from "@/components/ui/dot-pattern";

export default function MarketingLandingPage() {
  const displayedServicePackages = servicePackages.slice(0, 4);

  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-on-surface font-sans selection:bg-surface-container-high select-none">
      <DotPattern
        baseColor="#cbd5e1"
        glowColor="#36693c"
        proximity={140}
        glowIntensity={1.2}
      />

      {/* 1. Dedicated Floating Hero Section (Includes Floating Navbar, Rings, 8 Chips, CTAs, Activity Card Stack) */}
      <HeroSection />

      {/* Main Content Sections */}
      <main className="flex-1 w-full space-y-28 md:space-y-36 pb-20">

        {/* 2. Trusted By Brand Marquee */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant/60">
            TRUSTED BY 200,000+ USERS WORLDWIDE
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-black text-on-surface-variant tracking-wider">
            <span>Google</span>
            <span>airbnb</span>
            <span>coinbase</span>
            <span>Notion</span>
            <span>GUMROAD</span>
            <span>PayPal</span>
            <span>upwork</span>
            <span>shopify</span>
            <span>stripe</span>
            <span>zoom</span>
          </div>
        </section>

        {/* 3. Services Section */}
        <section id="services" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-28">
          <div className="flex items-end justify-between gap-4 border-b border-outline-variant/20 pb-5">
            <div className="space-y-1 text-left">
              <span className="text-[10px] uppercase tracking-widest font-black text-[var(--surface-tint)] block">
                HAVE A LOOK AT
              </span>
              <h2 className="text-3xl font-black tracking-tight text-on-surface">
                Our Key Services
              </h2>
            </div>
            <Link
              href="/signup?next=/projects/new"
              className="text-xs font-extrabold text-on-surface hover:text-[var(--surface-tint)] transition-colors flex items-center gap-1 shrink-0"
            >
              Browse all {servicePackages.length} <span className="text-[10px]">→</span>
            </Link>
          </div>

          {/* Dynamic Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedServicePackages.map((pkg, index) => {
              // Calculate badge
              const getBadgeText = (pkgId: string, deliveryTimeframe: string) => {
                if (pkgId === "business-website") return "POPULAR";
                const days = deliveryTimeframe.match(/\d+/g);
                if (days) {
                  const maxDays = Math.max(...days.map(Number));
                  if (maxDays <= 5) return "FAST";
                }
                return null;
              };
              const badge = getBadgeText(pkg.id, pkg.deliveryTimeframe);

              // SVG illustration placeholder helper
              const getCategorySvg = (category: string) => {
                if (category === "Web Development") {
                  return (
                    <svg className="w-12 h-12 text-[var(--surface-tint)]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  );
                }
                if (category === "Graphic Design") {
                  return (
                    <svg className="w-12 h-12 text-[var(--surface-tint)]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l.138.365a1.875 1.875 0 002.662.925l2.347-1.173a1.875 1.875 0 001.034-1.678V10.75m-6.181 5.372l-.138-.365a1.875 1.875 0 01.077-1.748l1.472-2.58a1.875 1.875 0 013.25 0l1.38 2.42a1.875 1.875 0 01.07 1.708l-.138.365M9.53 16.122a3 3 0 00-1.078-3.99L5.433 10.37a3.375 3.375 0 116.147-3.327l1.007 1.74M9.53 16.122H14.25" />
                    </svg>
                  );
                }
                if (category === "UI/UX" || category === "UI/UX Design") {
                  return (
                    <svg className="w-12 h-12 text-[var(--surface-tint)]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h12" />
                    </svg>
                  );
                }
                return (
                  <svg className="w-12 h-12 text-[var(--surface-tint)]/60" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                );
              };

              // Pricing string formatting helper
              const formatPrice = (price: string) => {
                if (price.startsWith("Starting from $")) {
                  return price;
                }
                if (price.startsWith("$")) {
                  return `Starting from ${price}`;
                }
                return `Starting from $${price}`;
              };

              return (
                <div
                  key={pkg.id}
                  className="bg-white border border-outline-variant/60 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 relative group text-left"
                >
                  <div className="space-y-4">
                    {/* Badge & Illustration Area */}
                    <div
                      className={`relative h-60 w-full rounded-lg overflow-hidden flex items-center justify-center border border-outline-variant/30 transition-colors ${
                        index % 2 === 0 ? "bg-[#f4eee4]" : "bg-white"
                      }`}
                    >
                      {badge && (
                        <span className="absolute top-3.5 left-3.5 text-[8px] font-black tracking-wider uppercase bg-white text-on-surface px-2.5 py-1 rounded shadow-xs z-10 border border-outline-variant/10">
                          {badge}
                        </span>
                      )}
                      
                      {/* SVG Category Icon inside container */}
                      <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                        {getCategorySvg(pkg.category)}
                      </div>

                      {/* Custom illustration overlay from user local */}
                      <img
                        src={`/services/${pkg.id}.png`}
                        alt={pkg.name}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                        className="absolute inset-0 w-full h-full object-contain z-5 p-4"
                      />
                    </div>

                    {/* Package Info */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-on-surface text-base tracking-tight leading-snug">{pkg.name}</h3>
                      <p className="text-xs text-on-surface-variant/80 font-medium">
                        {pkg.deliveryTimeframe}
                      </p>
                    </div>
                  </div>

                  {/* Bottom section with starting price and see more link */}
                  <div className="mt-8 flex justify-between items-center">
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      {formatPrice(pkg.indicativePrice)}
                    </span>

                    <Link
                      href={`/signup?next=/projects/new&service=${pkg.id}`}
                      className="text-xs font-black text-[var(--surface-tint)] hover:text-primary transition-colors flex items-center gap-0.5 shrink-0"
                    >
                      <span>See more</span>
                      <span className="text-xs">→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Selected Work Section */}
        <section id="work" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-28">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-headline-lg font-extrabold tracking-tight text-on-surface">Selected Work</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed font-medium">
              A curated showcase of our previous digital product and identity deliveries.
            </p>
          </div>

          <PortfolioGrid />
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-28">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-headline-lg font-extrabold tracking-tight text-on-surface">How It Works</h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed font-medium">
              We align our process directly with our platform lifecycle so your onboarding is simple and predictable.
            </p>
          </div>

          {/* 4 Columns step indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {[
              {
                num: "01",
                title: "Submit Brief",
                desc: "Share your project details, budget, and timeline.",
              },
              {
                num: "02",
                title: "Get Quoted",
                desc: "We review your request and provide a quote for your project.",
              },
              {
                num: "03",
                title: "In Progress",
                desc: "Our team gets to work on your project.",
              },
              {
                num: "04",
                title: "Get Delivered",
                desc: "Final delivery, reviewed and handed off.",
              },
            ].map((st) => (
              <div key={st.num} className="relative flex flex-col pt-12 group border-t border-outline-variant/30">
                {/* Pale numerical step behind the header */}
                <span className="absolute top-0 left-0 text-7xl font-black text-on-surface/[0.04] select-none pointer-events-none transition-colors duration-300 group-hover:text-[var(--surface-tint)]/[0.07]">
                  {st.num}
                </span>

                {/* Step Title & Details */}
                <div className="space-y-2 relative z-10 text-left">
                  <h3 className="text-sm font-extrabold text-on-surface tracking-tight flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-[var(--surface-tint)]">{st.num}.</span>
                    <span>{st.title}</span>
                  </h3>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Contact Section */}
        <section id="contact" className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center scroll-mt-28">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-headline-xl font-black tracking-tight text-on-surface leading-tight">
              Let's build <br />
              something together.
            </h2>
            <p className="text-body-md text-on-surface-variant leading-relaxed font-medium max-w-md">
              Have questions about pricing, scopes, or custom software platforms? Send an inquiry and our team will reply shortly.
            </p>
            <div className="space-y-3 text-xs font-bold text-on-surface pt-2">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">✉</span>
                <div>
                  <span className="text-[10px] text-outline block uppercase font-bold">Email us</span>
                  <span>hello@famx.com</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">📍</span>
                <div>
                  <span className="text-[10px] text-outline block uppercase font-bold">Our Studio</span>
                  <span>Silicon Valley & Bangalore</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </section>

      </main>

      {/* 7. Footer */}
      <footer className="w-full bg-surface-container-low border-t border-outline-variant py-16 text-on-surface-variant">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

            {/* Left Brand Column */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-on-primary font-black text-xs">
                  ⊕
                </div>
                <span className="text-lg font-black tracking-tight text-on-surface">
                  FAMX
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed max-w-sm font-medium">
                We design and build production-grade software platforms, custom web applications, and brand identities with speed and precision.
              </p>
              <div className="flex space-x-3 text-xs font-bold text-outline pt-2">
                <span className="hover:text-on-surface cursor-pointer">Twitter</span>
                <span>•</span>
                <span className="hover:text-on-surface cursor-pointer">Instagram</span>
                <span>•</span>
                <span className="hover:text-on-surface cursor-pointer">LinkedIn</span>
              </div>
            </div>

            {/* Three Link Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-medium">
              <div className="space-y-3">
                <span className="font-extrabold text-on-surface text-xs uppercase tracking-wider block">Solutions</span>
                <ul className="space-y-2 text-on-surface-variant">
                  <li><a href="#services" className="hover:text-on-surface transition-colors">Web Development</a></li>
                  <li><a href="#services" className="hover:text-on-surface transition-colors">UI/UX Design</a></li>
                  <li><a href="#services" className="hover:text-on-surface transition-colors">Graphic Design</a></li>
                  <li><a href="#services" className="hover:text-on-surface transition-colors">Brand Identity</a></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-on-surface text-xs uppercase tracking-wider block">Company</span>
                <ul className="space-y-2 text-on-surface-variant">
                  <li><a href="#work" className="hover:text-on-surface transition-colors">Work</a></li>
                  <li><a href="#how-it-works" className="hover:text-on-surface transition-colors">Process</a></li>
                  <li><a href="#contact" className="hover:text-on-surface transition-colors">Contact</a></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-on-surface text-xs uppercase tracking-wider block">Resources</span>
                <ul className="space-y-2 text-on-surface-variant">
                  <li><Link href="/login" className="hover:text-on-surface transition-colors">Sign in</Link></li>
                  <li><Link href="/signup?next=/projects/new" className="hover:text-on-surface transition-colors">Start a Project</Link></li>
                </ul>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-outline">
            <p>&copy; {new Date().getFullYear()} FAMX Agency. All rights reserved.</p>
            <div className="flex space-x-4">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Cookies Settings</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
