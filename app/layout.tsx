import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExpertsEarn — Answer. Earn. Repeat.",
  description: "Share your opinion, shape better products, and earn rewards with ExpertsEarn by ExpertsTeam.",
  applicationName: "ExpertsEarn"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}