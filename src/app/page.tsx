import React from "react";
import { getAllAnimals } from "@/lib/animals";
import { Navbar } from "@/components/common/navbar";
import { Footer } from "@/components/common/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { WhyChooseSection } from "@/components/landing/why-choose-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ProductsGrid } from "@/components/landing/products-grid";
import { ArDemoSection } from "@/components/landing/ar-demo-section";
import { BenefitsSection } from "@/components/landing/benefits-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaBanner } from "@/components/landing/cta-banner";
import { ParallaxBackground } from "@/components/landing/parallax-background";

export default function HomePage() {
  const animals = getAllAnimals();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#FCFBF7]">
      {/* Dynamic Parallax Background Orbs & Sparkles */}
      <ParallaxBackground />

      {/* 1. Navigation Bar */}
      <Navbar />

      <main className="flex-1">
        {/* 2. Hero Section */}
        <HeroSection />

        {/* 3. Why Choose Us Section */}
        <WhyChooseSection />

        {/* 4. How It Works Section */}
        <HowItWorksSection />

        {/* 5. Products Grid Section (Curated Combo Packs) */}
        <ProductsGrid />

        {/* 6. AR Demo Section */}
        <ArDemoSection />

        {/* 7. Benefits Section */}
        <BenefitsSection />

        {/* 8. FAQ Section */}
        <FaqSection />

        {/* 9. Final CTA Banner */}
        <CtaBanner />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
