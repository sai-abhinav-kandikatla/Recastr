import { Navbar } from "./Navbar";
import { HeroSection } from "./HeroSection";
import { SocialProof } from "./SocialProof";
import { WorkflowSection } from "./WorkflowSection";
import { FeatureGrid } from "./FeatureGrid";
import { PricingSection } from "./PricingSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <main className="min-h-screen bg-[#090909] text-white">

      <Navbar />

      <HeroSection />

      <SocialProof />

      <WorkflowSection />

      <FeatureGrid />

      <PricingSection />

      <FAQSection />

      <CTASection />

      <Footer />

    </main>
  );
}
