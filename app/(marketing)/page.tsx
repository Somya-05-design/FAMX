import Link from "next/link";
import { servicePackages } from "@/lib/content/service-packages";
import { testimonials } from "@/lib/content/testimonials";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { ContactForm } from "@/components/ContactForm";

export default function MarketingLandingPage() {
  // Group service packages by category
  const categories = ["Web Development", "Graphic Design", "UI/UX", "Custom Request"] as const;

  return (
    <div className="relative flex flex-col min-h-screen overflow-x-hidden">
      {/* Background ambient light effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/60 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-black tracking-tighter bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              FAMX
            </span>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-zinc-400">
            <a href="#services" className="hover:text-zinc-200 transition-colors">Services</a>
            <a href="#work" className="hover:text-zinc-200 transition-colors">Work</a>
            <a href="#how-it-works" className="hover:text-zinc-200 transition-colors">How It Works</a>
            <a href="#contact" className="hover:text-zinc-200 transition-colors">Contact</a>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-zinc-300 hover:text-white px-4 py-2 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup?next=/projects/new"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-md shadow-indigo-950/40"
            >
              Start a Project
            </Link>
          </div>
        </div>
      </header>

      {/* Main Sections */}
      <main className="flex-1 max-w-7xl mx-auto px-6 w-full py-12 space-y-28 md:space-y-36">
        
        {/* Hero Section */}
        <section className="relative pt-8 md:pt-16 pb-6 text-center space-y-8 max-w-4xl mx-auto animate-fadeIn">
          <div className="inline-flex items-center space-x-2 bg-zinc-900/60 border border-zinc-800/80 px-4 py-1.5 rounded-full text-xs font-semibold text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <span>Product Engineering & Brand Design Group</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15] sm:leading-[1.1] md:leading-[1.1]">
            We design and build <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              premium digital products
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Accelerate your roadmap. We deliver production-grade applications, custom software platforms, and high-fidelity brand identities with speed and absolute transparency.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link
              href="/signup?next=/projects/new"
              className="bg-white hover:bg-zinc-100 text-zinc-950 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-white/5"
            >
              Start a Project
            </Link>
            <a
              href="#work"
              className="bg-zinc-900/60 hover:bg-zinc-900 text-zinc-200 border border-zinc-805/80 hover:border-zinc-700 font-semibold px-8 py-3.5 rounded-xl text-sm transition-all duration-200"
            >
              See Our Work
            </a>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Services & Packages</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore our standard capabilities. From early stage MVPs to polished company logos, choose a starting package or request custom development.
            </p>
          </div>

          {/* Service categorization layout */}
          <div className="space-y-16">
            {categories.map((category) => {
              const packages = servicePackages.filter(p => p.category === category);
              if (packages.length === 0) return null;

              return (
                <div key={category} className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest shrink-0">
                      {category}
                    </h3>
                    <div className="h-px bg-zinc-900/60 flex-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="bg-zinc-900/20 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-6 flex flex-col justify-between space-y-6 transition-all duration-200"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-zinc-200 text-sm tracking-tight">{pkg.name}</h4>
                            <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                              {pkg.deliveryTimeframe}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed">{pkg.description}</p>
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Requirements:</span>
                            <p className="text-[11px] text-zinc-500 leading-relaxed italic">{pkg.requirements}</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-900/60 flex items-center justify-between gap-4">
                          <span className="text-xs font-bold text-zinc-300">{pkg.indicativePrice}</span>
                          <Link
                            href={`/signup?next=/projects/new&service=${pkg.id}`}
                            className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                          >
                            <span>Select Package</span>
                            <span className="text-[10px]">→</span>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/40 text-center max-w-xl mx-auto">
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              <strong>* Disclaimer:</strong> Estimates and price ranges listed above are indicative only. All projects are subject to admin review and formal approval, after which a binding quote is issued.
            </p>
          </div>
        </section>

        {/* Portfolio Section */}
        <section id="work" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Selected Work</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A curated showcase of our previous digital product and identity deliveries. We build everything with client privacy and top-tier fidelity in mind.
            </p>
          </div>

          <PortfolioGrid />
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="space-y-16 scroll-mt-24">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">How It Works</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              We align our public process directly with our platform lifecycle so your onboarding is clean, simple, and predictable.
            </p>
          </div>

          {/* Steps Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              {
                step: "01",
                title: "Submit Brief",
                desc: "Describe your scope, attach reference designs or briefs, and specify your proposed budget/timeline.",
                color: "border-violet-500/20 hover:border-violet-500/50",
              },
              {
                step: "02",
                title: "Get Quoted",
                desc: "Our engineering leads review your requirements and provide a transparent, non-binding quote.",
                color: "border-indigo-500/20 hover:border-indigo-500/50",
              },
              {
                step: "03",
                title: "In Progress",
                desc: "Accept the quote, deposit payment, and monitor real-time updates directly via your portal's board.",
                color: "border-cyan-500/20 hover:border-cyan-500/50",
              },
              {
                step: "04",
                title: "Delivery",
                desc: "Review status builds, communicate with developers, and receive your finalized production assets.",
                color: "border-emerald-500/20 hover:border-emerald-500/50",
              },
            ].map((step, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col justify-between p-6 bg-zinc-900/10 border ${step.color} rounded-2xl hover:bg-zinc-900/30 transition-all duration-300`}
              >
                <div>
                  <span className="text-3xl font-black text-zinc-800 block mb-4">{step.step}</span>
                  <h4 className="text-base font-bold text-zinc-200 mb-2">{step.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold tracking-tight text-white">Client Feedback</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Don't take our word for it. Here is what leading founders and project managers say about our engineering velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-zinc-900/20 border border-zinc-900 p-8 rounded-2xl flex flex-col justify-between space-y-6"
              >
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
                
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                    {t.avatarInitials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{t.author}</h4>
                    <p className="text-[10px] text-zinc-500">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form Section */}
        <section id="contact" className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center scroll-mt-24">
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              Let's build <br />
              something together.
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Have questions about pricing, scopes, or our custom development stacks? Send an inquiry and we'll reply shortly. 
            </p>
            <div className="space-y-4 text-xs text-zinc-500">
              <p className="flex items-center space-x-2">
                <span className="text-violet-400">✉</span>
                <span>inquiries@famx.agency</span>
              </p>
              <p className="flex items-center space-x-2">
                <span className="text-violet-400">📍</span>
                <span>Silicon Valley & Bangalore</span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <ContactForm />
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full bg-zinc-950 border-t border-zinc-900/60 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-zinc-500">
          <div className="flex items-center space-x-2">
            <span className="text-base font-bold tracking-tighter bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              FAMX
            </span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex space-x-6">
            <a href="#services" className="hover:text-zinc-300">Services</a>
            <a href="#work" className="hover:text-zinc-300">Work</a>
            <a href="#how-it-works" className="hover:text-zinc-300">How It Works</a>
            <Link href="/login" className="hover:text-zinc-300">Client Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
