'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';

const DynamicThreeGlobe = dynamic(() => import('./ThreeGlobe'), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[400px] flex items-center justify-center font-mono text-ink/50 font-bold">Loading 3D...</div>
});

export default function HeroSection() {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-cream py-16 lg:py-0">
      
      {/* Playful Floating Shapes with Parallax */}
      <motion.div style={{ y: y1, opacity, boxShadow: '4px 4px 0 #1A1A2E' }} className="absolute top-20 right-10 md:right-32 w-24 h-24 rounded-full bg-iris-purple border-3 border-ink animate-float"></motion.div>
      <motion.div style={{ y: y2, opacity, boxShadow: '4px 4px 0 #1A1A2E' }} className="absolute bottom-20 left-10 md:left-20 w-16 h-16 bg-sunny border-3 border-ink animate-wiggle rotate-12"></motion.div>
      
      {/* Decorative zig-zag using SVG with Parallax */}
      <motion.svg style={{ y: y1, opacity, animationDelay: '1s' }} className="absolute top-40 left-10 md:left-40 w-32 h-32 animate-float" viewBox="0 0 100 100">
        <path d="M10 50 L30 20 L50 80 L70 20 L90 50" fill="none" stroke="var(--color-coral)" strokeWidth="6" strokeLinecap="square" strokeLinejoin="miter" />
      </motion.svg>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left pt-10 lg:pt-0"
          >
            <div className="inline-block mb-6 rotate-[-2deg]">
              <div className="tag-sticker bg-sunny text-ink border-3">
                Built for FlowZint AI Hackathon 2026 🏆
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 text-ink leading-[1.1]">
              Cost-Aware AI <br className="hidden sm:block" />
              <span className="relative inline-block mt-2">
                <span className="relative z-10 gradient-text">For Education.</span>
                {/* Highlight underline */}
                <span className="absolute bottom-1 left-0 w-full h-4 bg-sunny -z-10 -rotate-1"></span>
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-ink font-medium mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              An intelligent educational assistant that dynamically routes queries between models to optimize learning, cost, and safety.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-12">
              <Link href="/dashboard" className="btn-primary text-lg w-full sm:w-auto">
                Try IRIS Bot Demo
              </Link>
              <Link href="#features" className="btn-outline text-lg w-full sm:w-auto">
                See Features
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <span className="text-sm font-bold font-caveat text-ink/70 text-xl mr-2">Smart Routing:</span>
              <div className="flex gap-3">
                <span className="px-3 py-1 border-2 border-ink bg-mint/20 text-ink text-xs font-bold shadow-[2px_2px_0px_#1A1A2E]">Simple → Kimi</span>
                <span className="px-3 py-1 border-2 border-ink bg-sunny/30 text-ink text-xs font-bold shadow-[2px_2px_0px_#1A1A2E]">Medium → Haiku</span>
                <span className="px-3 py-1 border-2 border-ink bg-coral/20 text-ink text-xs font-bold shadow-[2px_2px_0px_#1A1A2E]">Complex → Sonnet</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 w-full relative h-[400px] lg:h-[600px]"
          >
            {/* The 3D component container with a Neo-Brutalist frame */}
            <div className="absolute inset-4 lg:inset-10 bg-white border-4 border-ink shadow-[12px_12px_0px_#1A1A2E] overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-8 border-b-4 border-ink bg-cream flex items-center px-4 gap-2 z-20">
                <div className="w-3 h-3 rounded-full bg-coral border-2 border-ink"></div>
                <div className="w-3 h-3 rounded-full bg-sunny border-2 border-ink"></div>
                <div className="w-3 h-3 rounded-full bg-mint border-2 border-ink"></div>
              </div>
              <div className="w-full h-full pt-8 relative z-10 bg-cream">
                <DynamicThreeGlobe />
              </div>
              {/* Overlay sticker inside the frame */}
              <div className="absolute bottom-6 right-6 z-20 rotate-3">
                <span className="tag-sticker bg-peach text-ink font-caveat text-xl px-4 py-2 border-3">
                  Interactive!
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
