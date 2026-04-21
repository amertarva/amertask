"use client";

import React from "react";
import HomeBackground from "@/components/home/HomeBackground";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text overflow-hidden selection:bg-primary/30">
      <HomeBackground />

      <div className="relative z-10">
        <HeroSection />

        <FeaturesSection />
      </div>
    </div>
  );
}
