"use client";

import { useState } from "react";
import Link from "next/link";
import { servicePackages } from "@/lib/content/service-packages";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { ContactForm } from "@/components/ContactForm";
import { HeroSection } from "@/components/HeroSection";

export default function MarketingLandingPage() {
  const [activeSolutionsCategory, setActiveSolutionsCategory] = useState<string>("All services");

  const solutionsCategories = ["All services", "Web Development", "UI/UX Design", "Graphic Design"];

  const filteredServicePackages = activeSolutionsCategory === "All services"
    ? servicePackages
    : servicePackages.filter((pkg) => {
        if (activeSolutionsCategory === "UI/UX Design") {
          return pkg.category === "UI/UX" || pkg.category === "UI/UX Design";
        }
        return pkg.category === activeSolutionsCategory;
      });

  return (
    <div className="relative flex flex-col min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 select-none">
      
      {/* 1. Dedicated Floating Hero Section (Includes Floating Navbar, Rings, 8 Chips, CTAs, Activity Card Stack) */}
      <HeroSection />

      {/* Main Content Sections */}
      <main className="flex-1 w-full space-y-28 md:space-y-36 pb-20">

        {/* 2. Trusted By Brand Marquee */}
        <section className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400">
            TRUSTED BY 200,000+ USERS WORLDWIDE
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all text-xs font-black text-zinc-600 tracking-wider">
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

        {/* 3. Solutions Section */}
        <section id="services" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-28">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">Solutions</h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Explore our standard capabilities. Choose a starting package or request custom product development.
            </p>
          </div>

          {/* Solutions Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {solutionsCategories.map((cat) => {
              const isActive = activeSolutionsCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveSolutionsCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-black text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 6 Package Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServicePackages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white border border-zinc-200/80 hover:border-zinc-300 rounded-3xl p-7 flex flex-col justify-between space-y-6 transition-all duration-200 shadow-sm hover:shadow-xl hover:shadow-zinc-950/5"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-zinc-900 text-base tracking-tight">{pkg.name}</h3>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full shrink-0">
                      {pkg.deliveryTimeframe}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-medium">{pkg.description}</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-zinc-100">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Starting from</span>
                    <span className="text-lg font-black text-zinc-900">
                      {pkg.indicativePrice.replace("Starting from ", "")}
                    </span>
                  </div>
                  
                  <Link
                    href={`/signup?next=/projects/new&service=${pkg.id}`}
                    className="w-full bg-black hover:bg-zinc-800 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center transition-all shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Selected Work Section */}
        <section id="work" className="max-w-7xl mx-auto px-6 space-y-12 scroll-mt-28">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">Selected Work</h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              A curated showcase of our previous digital product and identity deliveries.
            </p>
          </div>

          <PortfolioGrid />
        </section>

        {/* 5. How It Works Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 space-y-16 scroll-mt-28">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-3xl font-black tracking-tight text-zinc-900">How It Works</h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              We align our process directly with our platform lifecycle so your onboarding is simple and predictable.
            </p>
          </div>

          {/* 4 Step Lifecycle Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              {
                step: 1,
                title: "Submit Brief",
                icon: (
                  <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                ),
              },
              {
                step: 2,
                title: "Get Quoted",
                icon: (
                  <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                  </svg>
                ),
              },
              {
                step: 3,
                title: "In Progress",
                icon: (
                  <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l5.654-4.654m0 0a3.003 3.003 0 01.765-1.209l3.03-2.496m-4.56 8.359l.044-.044" />
                  </svg>
                ),
              },
              {
                step: 4,
                title: "Get Delivered",
                icon: (
                  <svg className="w-6 h-6 text-zinc-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((st) => (
              <div key={st.step} className="flex flex-col items-center space-y-4 p-6 bg-zinc-50 border border-zinc-200/80 rounded-3xl">
                <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                  {st.icon}
                </div>
                <div className="w-7 h-7 rounded-full bg-zinc-200 text-zinc-800 font-black text-xs flex items-center justify-center">
                  {st.step}
                </div>
                <h3 className="text-sm font-bold text-zinc-900">{st.title}</h3>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Contact Section */}
        <section id="contact" className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center scroll-mt-28">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-4xl font-black tracking-tight text-zinc-900 leading-tight">
              Let's build <br />
              something together.
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium max-w-md">
              Have questions about pricing, scopes, or custom software platforms? Send an inquiry and our team will reply shortly.
            </p>
            <div className="space-y-3 text-xs font-bold text-zinc-700 pt-2">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">✉</span>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Email us</span>
                  <span>hello@famx.com</span>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <span className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">📍</span>
                <div>
                  <span className="text-[10px] text-zinc-400 block uppercase font-bold">Our Studio</span>
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
      <footer className="w-full bg-zinc-100 border-t border-zinc-200 py-16 text-zinc-600">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left Brand Column */}
            <div className="md:col-span-4 space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center text-white font-black text-xs">
                  ⊕
                </div>
                <span className="text-lg font-black tracking-tight text-zinc-900">
                  FAMX
                </span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-sm font-medium">
                We design and build production-grade software platforms, custom web applications, and brand identities with speed and precision.
              </p>
              <div className="flex space-x-3 text-xs font-bold text-zinc-400 pt-2">
                <span className="hover:text-zinc-900 cursor-pointer">Twitter</span>
                <span>•</span>
                <span className="hover:text-zinc-900 cursor-pointer">Instagram</span>
                <span>•</span>
                <span className="hover:text-zinc-900 cursor-pointer">LinkedIn</span>
              </div>
            </div>

            {/* Three Link Columns */}
            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-medium">
              <div className="space-y-3">
                <span className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider block">Solutions</span>
                <ul className="space-y-2 text-zinc-500">
                  <li><a href="#services" className="hover:text-zinc-900 transition-colors">Web Development</a></li>
                  <li><a href="#services" className="hover:text-zinc-900 transition-colors">UI/UX Design</a></li>
                  <li><a href="#services" className="hover:text-zinc-900 transition-colors">Graphic Design</a></li>
                  <li><a href="#services" className="hover:text-zinc-900 transition-colors">Brand Identity</a></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider block">Company</span>
                <ul className="space-y-2 text-zinc-500">
                  <li><a href="#work" className="hover:text-zinc-900 transition-colors">Work</a></li>
                  <li><a href="#how-it-works" className="hover:text-zinc-900 transition-colors">Process</a></li>
                  <li><a href="#contact" className="hover:text-zinc-900 transition-colors">Contact</a></li>
                </ul>
              </div>

              <div className="space-y-3">
                <span className="font-extrabold text-zinc-900 text-xs uppercase tracking-wider block">Resources</span>
                <ul className="space-y-2 text-zinc-500">
                  <li><Link href="/login" className="hover:text-zinc-900 transition-colors">Sign in</Link></li>
                  <li><Link href="/signup?next=/projects/new" className="hover:text-zinc-900 transition-colors">Start a Project</Link></li>
                </ul>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] font-semibold text-zinc-400">
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
