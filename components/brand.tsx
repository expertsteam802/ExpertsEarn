import Link from "next/link";

export function Brand({compact=false,light=false}:{compact?:boolean;light?:boolean}) {
  return <Link href="/" aria-label="ExpertsEarn home" className="inline-flex items-center gap-3">
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 3.5 43 14.2v19.6L24 44.5 5 33.8V14.2L24 3.5Z" stroke="currentColor" strokeWidth="1.2"/><path d="M31.5 13H17.3c-2.4 0-4.3 1.9-4.3 4.3v13.4c0 2.4 1.9 4.3 4.3 4.3h14.2M14 24h15.5M24 13v22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="square"/><circle cx="34" cy="24" r="2.3" fill="currentColor"/></svg></span>
    {!compact&&<span className={light?"brand-word brand-word-light":"brand-word"}>Experts<span>Earn</span></span>}
  </Link>;
}
