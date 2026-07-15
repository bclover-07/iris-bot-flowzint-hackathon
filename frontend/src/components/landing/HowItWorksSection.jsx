'use client';
import { motion } from 'framer-motion';

const steps = [
  {
    num: "1",
    title: "Ask a Question",
    desc: "Type your query into the IRIS chat interface.",
    color: "mint"
  },
  {
    num: "2",
    title: "PIGuard Scan",
    desc: "Prompts are scanned for injections. Malicious ones are blocked instantly.",
    color: "coral"
  },
  {
    num: "3",
    title: "Smart Routing",
    desc: "IRIS evaluates complexity and routes to Kimi, Haiku, or Sonnet.",
    color: "sunny"
  },
  {
    num: "4",
    title: "Learn & Track",
    desc: "Get your answer while tracking budget and model usage transparently.",
    color: "iris-purple"
  }
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-cream relative border-t-4 border-ink overflow-hidden">
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#1A1A2E 1px, transparent 1px), linear-gradient(90deg, #1A1A2E 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-block mb-4">
            <span className="tag-sticker bg-mint text-ink rotate-2">The Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-ink mb-6">
            How <span className="text-iris-purple font-caveat text-5xl md:text-6xl tracking-wider">IRIS</span> Works
          </h2>
          <p className="text-xl text-ink font-medium">
            A transparent pipeline that protects your budget while delivering the best educational answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              key={i} 
              className={`neo-card p-6 card-${step.color} h-full flex flex-col items-center text-center`}
            >
              <div className={`w-16 h-16 rounded-full border-3 border-ink flex items-center justify-center bg-${step.color} shadow-[4px_4px_0_#1A1A2E] mb-6 -mt-10`}>
                <span className="text-2xl font-black text-ink">{step.num}</span>
              </div>
              <h3 className="text-xl font-black text-ink mb-3">{step.title}</h3>
              <p className="text-ink font-medium leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
