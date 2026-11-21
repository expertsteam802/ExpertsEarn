import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, ShieldCheck, Wallet, Globe2, ChartNoAxesCombined, MoveUpRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { AdFirstClickLink } from "@/components/ad-first-click-link";

export const metadata: Metadata = {
  title: { absolute: "Paid Online Surveys Worldwide | ExpertsEarn" },
  description: "Join ExpertsEarn from supported locations worldwide. Discover eligible paid surveys, share your opinions and track approved rewards. Survey availability and reward terms vary by country.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Paid Online Surveys Worldwide | ExpertsEarn",
    description: "Discover eligible online surveys with ExpertsEarn worldwide. Share your perspective, take part in research and track approved rewards. Availability varies by country.",
    url: "/",
  },
};

const highlights = [
  { icon: Wallet, title: "A clear rewards ledger", copy: "See verified earnings, pending payouts and every wallet movement in one place." },
  { icon: ShieldCheck, title: "Designed for trusted research", copy: "Eligibility checks and response-quality controls help protect the value of every study." },
  { icon: Globe2, title: "Local voices. Global insight.", copy: "Reach respondents across Rwanda and international markets with targeted research." },
];

const faqs = [
  { question: "Can I earn rewards in Rwandan francs (RWF)?", answer: "Eligible studies display their reward terms before you begin. When you complete a study successfully and its response passes the required checks, the assigned reward is recorded in your ExpertsEarn wallet in RWF. Payout requests are subject to the minimum shown in your account, supported payment methods and review." },
  { question: "Who can join ExpertsEarn and take surveys?", answer: "People can create an account and complete the profile information used to match them with relevant studies. Each study has its own eligibility rules, which may include country, age range, language or other research criteria. Availability is not guaranteed and varies by study." },
  { question: "How do payouts work?", answer: "Your wallet shows verified rewards and payout activity. When your available balance meets the minimum displayed in your account, you can submit a payout request using a payment method currently supported by ExpertsEarn. Requests may require identity checks and administrator review; submitting a request does not itself confirm that a transfer has been made." },
  { question: "How does ExpertsEarn protect my personal information?", answer: "ExpertsEarn uses account and access controls to operate the platform, protect accounts and manage research participation. Survey answers may be shared with the organization commissioning that study for its disclosed research purpose. Read our Privacy Policy for details about information, advertising technologies, retention and your privacy choices." },
  { question: "Which languages does ExpertsEarn support?", answer: "ExpertsEarn is designed for English, Kinyarwanda and Français. The language available for an individual study depends on the research team and the study setup, so check each study's details before participating." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#090a0f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c") }} />
      <header className="container flex h-[86px] items-center justify-between border-b border-white/[.07]">
        <Brand />
        <nav aria-label="Main navigation" className="hidden items-center gap-8 text-[13px] font-semibold text-[#aaa6a2] md:flex">
          <a href="#experience" className="hover:text-[#e9d8b6]">Platform</a>
          <a href="#research" className="hover:text-[#e9d8b6]">For research teams</a>
          <Link href="/how-it-works" className="hover:text-[#e9d8b6]">How it works</Link>
          <Link href="/about" className="hover:text-[#e9d8b6]">About us</Link>
          <Link href="/contact" className="hover:text-[#e9d8b6]">Contact us</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-sm font-bold text-[#d6d0c5] sm:block">Log in</Link>
          <Link href="/signup" className="metal-button text-sm">Create account <ArrowUpRight size={16} /></Link>
        </div>
      </header>

      <section className="ambient-bg relative isolate min-h-[690px] overflow-hidden border-b border-white/[.06]">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#090a0f] via-[#090a0f]/95 to-[#090a0f]/25" />
        <div className="container grid min-h-[690px] items-center gap-16 py-20 lg:grid-cols-[1.08fr_.92fr]">
          <div className="max-w-[730px]">
            <div className="eyebrow flex items-center gap-3"><span className="h-px w-9 bg-[#c6a873]" /> ExpertsEarn · Independent insight network</div>
            <h1 className="mt-7 text-5xl font-semibold leading-[1.04] tracking-[-.055em] text-[#f3eee4] sm:text-6xl lg:text-[76px]">Paid online surveys<br /><span className="font-serif italic font-normal text-[#c9ad7d]">worldwide. Your insight has value.</span></h1>
            <p className="mt-7 max-w-xl text-[17px] leading-8 text-[#aaa6a2]">Discover paid online surveys and research studies from teams around the world. Share your perspective, help shape better products and services, and earn eligible rewards in Rwandan francs (RWF).</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/signup" className="metal-button">Join ExpertsEarn <MoveUpRight size={17} /></Link><AdFirstClickLink href="/partners" className="ghost-button" label="Research partner access">Research partner access</AdFirstClickLink></div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-bold uppercase tracking-[.16em] text-[#77767c]"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[#c6a873]" /> Privacy-aware participation</span><span>English · Kinyarwanda · Français</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[490px]">
            <div className="absolute -inset-8 rounded-full bg-[#a17c4c]/10 blur-[80px]" />
            <div className="surface relative overflow-hidden p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-white/[.08] pb-5"><div><p className="eyebrow">Member overview</p><p className="mt-2 text-lg font-bold text-[#f0e9dc]">Your perspective matters</p></div><span className="rounded-full border border-[#c6a873]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d3bd96]">Preview</span></div>
              <div className="mt-7 rounded-2xl border border-white/[.08] bg-gradient-to-br from-[#25232a] to-[#12131a] p-5">
                <div className="flex items-center justify-between"><span className="text-sm text-[#a7a2a0]">Rewards wallet</span><Wallet size={18} className="text-[#c6a873]" /></div>
                <p className="mt-3 text-4xl font-semibold tracking-tight text-[#f3eee4]">— <span className="text-sm font-semibold text-[#aaa6a2]">RWF</span></p>
                <p className="mt-2 text-xs text-[#77767c]">Your verified balance appears after sign in.</p>
                <div className="mt-6 h-px bg-white/[.08]" />
                <div className="mt-4 flex justify-between text-xs"><span className="text-[#aaa6a2]">Earned this week</span><span className="font-bold text-[#d4bd94]">Live account data</span></div>
              </div>
              <div className="mt-5 space-y-3">{[{ n: "Consumer choices", t: "Short opinion study", v: "Available when eligible" }, { n: "Digital experiences", t: "Technology research", v: "Personalized matching" }].map((x) => <div key={x.n} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-4"><div><p className="text-sm font-bold text-[#e8e0d3]">{x.n}</p><p className="mt-1 text-xs text-[#89858a]">{x.t}</p></div><span className="text-right text-[10px] font-bold uppercase tracking-wider text-[#c6a873]">{x.v}</span></div>)}</div>
              <p className="mt-5 text-center text-[10px] text-[#66656d]">Illustrative interface · rewards depend on approved survey terms</p>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="container py-24">
        <div className="max-w-3xl"><p className="eyebrow">The experience</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#f0e9dc] sm:text-4xl">Paid survey opportunities and research rewards, made clearer.</h2><p className="mt-4 leading-7 text-[#969198]">ExpertsEarn brings survey opportunities, transparent reward tracking and research participation tools together in one considered space.</p></div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">{highlights.map((x, i) => <article key={x.title} className="surface group p-7 transition duration-300 hover:-translate-y-1 hover:border-[#c6a873]/35"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[.2em] text-[#696771]">0{i + 1}</span><x.icon size={22} className="text-[#c6a873]" /></div><h3 className="mt-9 text-lg font-bold text-[#eee7dc]">{x.title}</h3><p className="mt-3 text-sm leading-7 text-[#969198]">{x.copy}</p></article>)}</div>
      </section>

      <section className="border-y border-white/[.07] bg-[#0e0f15] py-20">
        <div className="container grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow">Paid online surveys worldwide</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#f0e9dc] sm:text-4xl">Earn RWF rewards for sharing local knowledge and lived experience.</h2><p className="mt-4 max-w-2xl leading-7 text-[#969198]">Research helps organizations understand the people they serve. ExpertsEarn gives eligible participants in supported locations worldwide a place to discover studies, review reward terms and contribute their views. Study availability, eligibility and reward amounts vary; no earnings are guaranteed.</p><Link href="/how-it-works" className="ghost-button mt-6">See how participation works <ArrowUpRight size={16} /></Link></div><div className="surface max-w-sm p-6"><h3 className="text-lg font-bold text-[#eee7dc]">Research in three languages</h3><p className="mt-3 text-sm leading-7 text-[#969198]">Explore the platform in English, Kinyarwanda or Français. Each research team selects the languages available for its own study.</p><p className="mt-5 text-xs font-bold uppercase tracking-widest text-[#c6a873]">English · Kinyarwanda · Français</p></div></div>
      </section>

      <section id="research" className="container py-20">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow flex items-center gap-2"><ChartNoAxesCombined size={16} /> Market research network</p><h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[#f0e9dc] sm:text-4xl">For research teams: reach respondents and build better market research.</h2><p className="mt-4 max-w-2xl leading-7 text-[#969198]">Create targeted studies, manage response collection and connect your workflow through the ExpertsEarn partner API. Partner applications are reviewed before publishing and API access are enabled.</p></div><AdFirstClickLink href="/partners" className="ghost-button" label="Explore partner tools">Explore partner tools <ArrowUpRight size={16} /></AdFirstClickLink></div>
      </section>

      <section id="faq" className="border-y border-white/[.07] bg-[#0e0f15] py-20">
        <div className="container"><div className="max-w-2xl"><p className="eyebrow">Helpful answers</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#f0e9dc] sm:text-4xl">Frequently asked questions about ExpertsEarn</h2><p className="mt-4 leading-7 text-[#969198]">Learn about survey eligibility, RWF rewards, payouts, privacy and language options.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">{faqs.map((faq, index) => <article key={faq.question} className="surface p-6"><p className="eyebrow">0{index + 1}</p><h3 className="mt-3 text-lg font-bold text-[#eee7dc]">{faq.question}</h3><p className="mt-3 text-sm leading-7 text-[#aaa6a2]">{faq.answer}</p></article>)}</div>
          <p className="mt-8 text-sm text-[#969198]">Need more help? Visit our <Link href="/how-it-works" className="text-[#d5bd91] underline">How it works</Link> page or <Link href="/contact" className="text-[#d5bd91] underline">contact the ExpertsEarn team</Link>.</p>
        </div>
      </section>

      <footer className="container flex flex-col gap-6 py-9 text-xs text-[#77747a] sm:flex-row sm:items-center sm:justify-between">
        <div><Brand /><p className="mt-3">© {new Date().getFullYear()} ExpertsEarn by ExpertsTeam.</p></div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-3">
          <Link href="/how-it-works">How it works</Link><Link href="/partners">For research teams</Link><Link href="/about">About us</Link><Link href="/contact">Contact us</Link><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of service</Link>
        </nav>
        <div><span>Insight has value.</span></div>
      </footer>
    </main>
  );
}
