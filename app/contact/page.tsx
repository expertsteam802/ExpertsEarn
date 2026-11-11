import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact ExpertsEarn",
  description: "Contact the ExpertsEarn team for account support, survey questions, research partnerships, privacy requests and platform feedback.",
  alternates: { canonical: "/contact" },
};

import Link from "next/link"; import {Brand} from "@/components/brand";
export default function ContactPage(){return <main className="min-h-screen bg-[#090a0f]"><header className="container flex h-20 items-center justify-between"><Brand/><Link href="/" className="text-sm font-bold text-[#c6a873]">Back home</Link></header><section className="container max-w-3xl py-20"><p className="eyebrow">Contact us</p><h1 className="mt-5 text-5xl font-semibold tracking-tight text-[#f2ecdf]">Let’s talk.</h1><p className="mt-6 leading-8 text-[#aaa6a2]">For account support, research partnerships, privacy questions or platform feedback, contact the ExpertsEarn team.</p><div className="surface mt-10 p-7"><p className="text-sm font-bold text-[#eee7dc]">Account and survey support</p><p className="mt-2 text-sm leading-7 text-[#aaa6a2]">For account support, survey issues, research partnerships or privacy questions, email the ExpertsEarn team directly.</p><a className="mt-3 inline-block text-lg font-bold text-[#d5bd91]" href="mailto:mucyochristhecla@gmail.com">mucyochristhecla@gmail.com</a><div className="mt-5 flex flex-wrap gap-3"><Link href="/login" className="metal-button">Member sign in</Link><Link href="/partners" className="ghost-button">Research partnerships</Link></div><p className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-[#77747a]">Never send passwords, one-time codes or identity documents by email.</p></div></section></main>}
