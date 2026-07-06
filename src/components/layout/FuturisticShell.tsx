"use client";

import { Orbitron } from "next/font/google";
import FuturisticScene3D from "@/components/landing/FuturisticScene3D";
import "@/components/landing/landing-futuristic.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-orbitron",
});

export default function FuturisticShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`landing-futuristic min-h-screen overflow-x-hidden bg-[#050505] ${orbitron.variable}`}
    >
      <FuturisticScene3D />
      <div className="lf-grid-overlay" aria-hidden />
      <div className="lf-vignette" aria-hidden />
      <div className="lf-page relative">{children}</div>
    </div>
  );
}
