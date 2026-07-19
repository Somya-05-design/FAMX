export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  avatarInitials: string;
  gradient: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    quote: "FAMX delivered our SaaS MVP two weeks ahead of schedule. The code quality is stellar, and their team made requirements gathering entirely painless. We went from brief to live in record time.",
    author: "Sarah Jenkins",
    role: "Co-Founder & CTO",
    company: "Nova Analytics",
    avatarInitials: "SJ",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    id: "t2",
    quote: "The brand identity suite created by FAMX perfectly captured our vision. They provided comprehensive guidelines that our developers and marketers could immediately run with. Highly recommended.",
    author: "Marcus Chen",
    role: "Managing Partner",
    company: "Apex Ventures",
    avatarInitials: "MC",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "t3",
    quote: "Designing a decentralized application is a UI/UX nightmare, but FAMX simplified the flow beautifully. The transaction screens are intuitive, responsive, and look gorgeous.",
    author: "Elena Rostova",
    role: "Head of Product",
    company: "Quantum Labs",
    avatarInitials: "ER",
    gradient: "from-emerald-500 to-teal-500",
  },
];
