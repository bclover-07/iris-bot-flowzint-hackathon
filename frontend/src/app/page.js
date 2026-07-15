import dynamic from 'next/dynamic';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import Footer from '@/components/landing/Footer';

// Use dynamic imports for 3D elements if needed in HeroSection, 
// but we'll import the sections normally to prevent layout shift.

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-ink font-sans selection:bg-sunny selection:text-ink">
      <Navbar />
      <main className="pt-20">
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
