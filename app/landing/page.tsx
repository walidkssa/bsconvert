import { Metadata } from "next";
import CTABanner from "@/components/landing/cta-banner";
import FAQ from "@/components/landing/faq";
import Features from "@/components/landing/features";
import Footer from "@/components/landing/footer";
import Hero from "@/components/landing/hero";
import Navbar from "@/components/landing/navbar";
import Pricing from "@/components/landing/pricing";
import SecurityCompliance from "@/components/landing/security-compliance";
import Testimonials from "@/components/landing/testimonials";
import FreeTrial from "@/components/landing/free-trial";
import { landingMetadata } from "@/lib/metadata";

export const metadata: Metadata = landingMetadata;

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 xs:pt-20 sm:pt-24">
        <Hero />
        <FreeTrial />
        <Features />
        <SecurityCompliance />
        <Pricing />
        <FAQ />
        <Testimonials />
        <CTABanner />
        <Footer />
      </main>
    </>
  );
}
