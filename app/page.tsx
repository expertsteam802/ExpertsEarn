import Link from "next/link";
import { ArrowRight, BadgeCheck, Globe2, ShieldCheck, Wallet, ChartNoAxesCombined, Sparkles } from "lucide-react";

const features = [
  { icon: Wallet, title: "Rewards you can track", text: "See your RWF balance, completed surveys, and payout history in one wallet." },
  { icon: ShieldCheck, title: "Built for trusted responses", text: "Phone verification and fair participation checks help protect the community." },
  { icon: Globe2, title: "Local insight, global reach", text: "Answer in English, Kinyarwanda, or French and discover surveys that match your profile." }
];

export default function HomePage() {
  return <main className="min-h-screen overflow-hidden">
    <header className="container flex h-20 items-center justify-between">
      <Link href="/" className="flex items-center gap-3 font-extrabold tracking-tight text-forest"><span className="grid h-10 w-10 place-items-center rounded-xl bg-forest text-lg text-white">E</span><span className="text-xl">ExpertsEarn</span></Link>
      <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex"><a href="#how-it-works" className="hover:text-forest">How it works</a><a href="#partners" className="hover:text-forest">For businesses</a><a href="#trust" className="hover:text-forest">Trust & safety</a></nav>
      <div className="flex items-center gap-3"><Link href="/login" className="hidden rounded-xl px-4 py-2.5 text-sm font-bold text-forest sm:block">Log in</Link><Link href="/signup" className="rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-forest/15">Join free <ArrowRight className="ml-1 inline h-4 w-4"/></Link></div>
    </header>

    <section className="container grid items-center gap-12 pb-20 pt-12 md:grid-cols-[1.05fr_.95fr] md:pb-28 md:pt-20">
      <div><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-forest"><Sparkles className="h-4 w-4"/> A smarter way to share your voice</div>
        <h1 className="max-w-2xl text-5xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-6xl">Your opinion has <span className="text-forest">value.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Take meaningful surveys, help organizations make better decisions, and earn rewards for every verified response.</p>
        <div className="mt-8 flex flex-wrap gap-3"><Link href="/signup" className="rounded-xl bg-forest px-6 py-3.5 font-bold text-white shadow-xl shadow-forest/20">Start earning <ArrowRight className="ml-2 inline h-4 w-4"/></Link><a href="#how-it-works" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700">See how it works</a></div>
        <div className="mt-8 flex items-center gap-3 text-sm text-slate-500"><BadgeCheck className="h-5 w-5 text-emerald-700"/> Free to join · Transparent rewards · Secure payouts</div>
      </div>
      <div className="relative"><div className="absolute -inset-6 rounded-[36px] bg-gradient-to-br from-emerald-100 via-transparent to-amber-100 blur-2xl"/>
        <div className="surface relative p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-slate-500">Your rewards wallet</p><p className="mt-1 text-3xl font-black text-slate-900">12,500 <span className="text-base font-bold text-slate-500">RWF</span></p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700"><Wallet/></div></div>
          <div className="mt-7 rounded-2xl bg-forest p-5 text-white"><p className="text-sm text-emerald-100">Weekly progress</p><div className="mt-2 flex items-end justify-between"><span className="text-3xl font-extrabold">4 surveys</span><span className="text-sm text-emerald-100">+3,200 RWF</span></div><div className="mt-4 h-2 rounded-full bg-white/20"><div className="h-2 w-3/4 rounded-full bg-amber-400"/></div><p className="mt-2 text-xs text-emerald-100">You're making great progress</p></div>
          <div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">Shopping habits</p><p className="text-xs text-slate-500">5 minutes · Consumer goods</p></div><span className="font-extrabold text-forest">+800 RWF</span></div><div className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div><p className="font-bold text-slate-800">Digital services</p><p className="text-xs text-slate-500">8 minutes · Technology</p></div><span className="font-extrabold text-forest">+1,200 RWF</span></div></div>
          <p className="mt-4 text-center text-[11px] text-slate-400">Illustrative preview · actual rewards depend on each survey</p>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="border-y border-slate-100 bg-white py-16"><div className="container"><div className="mx-auto max-w-xl text-center"><p className="text-sm font-extrabold uppercase tracking-[.18em] text-amber-600">Simple by design</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Answer. Earn. Repeat.</h2><p className="mt-3 text-slate-500">A clear journey from your first survey to your first payout.</p></div><div className="mt-10 grid gap-5 md:grid-cols-3">{[{n:"01",t:"Create your profile",d:"Sign up, verify your phone, and tell us a little about yourself."},{n:"02",t:"Answer surveys",d:"Find surveys that fit your profile and share honest, thoughtful answers."},{n:"03",t:"Get rewarded",d:"Track verified rewards in your wallet and request a payout when eligible."}].map(x=><div key={x.n} className="rounded-2xl border border-slate-100 bg-mist p-6"><span className="text-sm font-black text-amber-600">{x.n}</span><h3 className="mt-4 text-lg font-extrabold text-slate-900">{x.t}</h3><p className="mt-2 leading-7 text-slate-500">{x.d}</p></div>)}</div></div></section>

    <section id="partners" className="container py-16"><div className="surface grid gap-8 p-8 md:grid-cols-[1fr_auto] md:items-center md:p-10"><div><div className="flex items-center gap-2 text-forest"><ChartNoAxesCombined className="h-5 w-5"/><span className="text-sm font-extrabold">For research teams</span></div><h2 className="mt-3 text-2xl font-black text-slate-950">Reach the people whose opinions matter.</h2><p className="mt-3 max-w-2xl leading-7 text-slate-500">Create targeted surveys, manage responses, and integrate research workflows through our partner API.</p></div><Link href="/partners" className="whitespace-nowrap rounded-xl border border-forest px-5 py-3 text-center font-bold text-forest">Explore partner tools <ArrowRight className="ml-2 inline h-4 w-4"/></Link></div></section>
    <footer id="trust" className="border-t border-slate-100 bg-white py-8"><div className="container flex flex-col justify-between gap-3 text-sm text-slate-500 sm:flex-row"><span>© {new Date().getFullYear()} ExpertsEarn by ExpertsTeam.</span><span>Privacy-first research · English · Kinyarwanda · Français</span></div></footer>
  </main>;
}