import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";
export const metadata: Metadata = { title:"ExpertsEarn — Insight has value",description:"A premium research and rewards platform by ExpertsTeam.",applicationName:"ExpertsEarn",icons:{icon:"/expertsearn-mark.svg",apple:"/expertsearn-mark.svg"},appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"ExpertsEarn"} };
export const viewport: Viewport = { width:"device-width",initialScale:1,themeColor:"#090a0f" };
export default function RootLayout({children}:{children:React.ReactNode}) {
 const adsenseClient=process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
 return <html lang="en"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/></head><body>{children}<PwaRegister/>{adsenseClient&&<Script async strategy="afterInteractive" crossOrigin="anonymous" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}/>}</body></html>;
}
