import Link from "next/link";
import Image from "next/image";

export function Brand({compact=false,light=false}:{compact?:boolean;light?:boolean}) {
  return <Link href="/" aria-label="ExpertsEarn home" className="inline-flex items-center gap-3">
    <span className="brand-mark" aria-hidden="true"><Image src="/expertsearn-mark.svg" alt="" width={36} height={36} priority /></span>
    {!compact&&<span className={light?"brand-word brand-word-light":"brand-word"}>Experts<span>Earn</span></span>}
  </Link>;
}
