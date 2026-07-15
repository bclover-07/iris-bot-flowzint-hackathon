'use client';
import { motion } from 'framer-motion';
import { RiRobot2Line, RiBookOpenLine, RiRocketLine, RiShieldCheckLine, RiWallet3Line } from 'react-icons/ri';

const features = [
  {
    title: "AI Assistant",
    desc: "A powerful chat interface that handles everything from basic facts to complex coding problems.",
    icon: RiRobot2Line,
    color: "bg-iris-purple",
    tags: ["Dynamic Routing", "Context Aware"]
  },
  {
    title: "Quiz Forge",
    desc: "Upload your notes or pick a topic to instantly generate tailored quizzes to test your knowledge.",
    icon: RiBookOpenLine,
    color: "bg-sunny",
    tags: ["Auto-Grading", "PDF Support"]
  },
  {
    title: "Career Sim",
    desc: "Input your skills and dream job. IRIS generates a complete learning path to get you there.",
    icon: RiRocketLine,
    color: "bg-peach",
    tags: ["Skill Gap Analysis", "Salary Estimates"]
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-ink relative border-t-4 border-ink">
      {/* Playful zig-zag top border using absolute positioning */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] transform -translate-y-[99%]">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-[30px]">
          <path d="M0,120 L60,0 L120,120 L180,0 L240,120 L300,0 L360,120 L420,0 L480,120 L540,0 L600,120 L660,0 L720,120 L780,0 L840,120 L900,0 L960,120 L1020,0 L1080,120 L1140,0 L1200,120" fill="none" stroke="var(--color-ink)" strokeWidth="6" />
          <path d="M0,120 L60,0 L120,120 L180,0 L240,120 L300,0 L360,120 L420,0 L480,120 L540,0 L600,120 L660,0 L720,120 L780,0 L840,120 L900,0 L960,120 L1020,0 L1080,120 L1140,0 L1200,120 L1200,120 L0,120 Z" fill="var(--color-ink)" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-cream mb-6">
            More Than Just Chat
          </h2>
          <p className="text-xl text-cream/80 font-medium">
            IRIS comes with built-in tools designed specifically for students and learners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feat, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              key={i} 
              className="neo-card p-6 bg-cream flex flex-col h-full hover:-translate-y-2 transition-transform duration-300"
            >
              <div className={`w-14 h-14 ${feat.color} border-3 border-ink flex items-center justify-center mb-6 shadow-[4px_4px_0_#1A1A2E]`}>
                <feat.icon className="w-7 h-7 text-ink" />
              </div>
              <h3 className="text-2xl font-black text-ink mb-3">{feat.title}</h3>
              <p className="text-ink font-medium leading-relaxed mb-6 flex-grow">
                {feat.desc}
              </p>
              <div className="flex flex-wrap gap-2 mt-auto">
                {feat.tags.map((tag, j) => (
                  <span key={j} className="px-2 py-1 bg-white border-2 border-ink text-[10px] font-bold uppercase text-ink">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security & Budget Info Box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-cream border-4 border-ink shadow-[8px_8px_0_#FFD93D] p-8 lg:p-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex gap-2 mb-4">
                <span className="tag-sticker bg-mint">Secure</span>
                <span className="tag-sticker bg-sunny">Cost-Aware</span>
              </div>
              <h3 className="text-3xl font-black text-ink mb-4">Enterprise-grade safety for students</h3>
              <p className="text-ink font-medium text-lg">
                Built-in PIGuard catches prompt injections before they execute, while the budget meter ensures you never exceed your limits.
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-auto">
              <div className="bg-white border-3 border-ink p-4 flex items-center gap-4">
                <RiShieldCheckLine className="w-8 h-8 text-mint" />
                <div>
                  <p className="font-bold text-ink">Prompt Injection</p>
                  <p className="text-sm font-mono text-ink">Blocked instantly</p>
                </div>
              </div>
              <div className="bg-white border-3 border-ink p-4 flex items-center gap-4">
                <RiWallet3Line className="w-8 h-8 text-iris-purple" />
                <div>
                  <p className="font-bold text-ink">Budget Limit</p>
                  <p className="text-sm font-mono text-ink">$2.00 / Session</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
