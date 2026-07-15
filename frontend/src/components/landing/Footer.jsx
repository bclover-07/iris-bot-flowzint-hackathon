import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-ink border-t-4 border-ink relative pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          <div>
            <Link href="/" className="text-3xl font-black tracking-tighter text-cream flex items-center gap-1 mb-4">
              IRIS <span className="text-iris-purple">✦</span>
            </Link>
            <p className="text-cream/70 font-medium mb-6 max-w-xs">
              Intelligent Routing System built for education. Optimizing cost, speed, and safety for every query.
            </p>
            <span className="tag-sticker bg-sunny text-ink border-cream shadow-none">
              Built with Otari
            </span>
          </div>

          <div>
            <h4 className="text-cream font-bold text-lg mb-4 uppercase tracking-widest">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="#features" className="text-cream/70 hover:text-sunny transition-colors font-medium">Features</Link></li>
              <li><Link href="#how-it-works" className="text-cream/70 hover:text-sunny transition-colors font-medium">How it Works</Link></li>
              <li><Link href="/login" className="text-cream/70 hover:text-sunny transition-colors font-medium">Sign In</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-cream font-bold text-lg mb-4 uppercase tracking-widest">Hackathon</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-cream/70 hover:text-mint transition-colors font-medium">Ignite Room</a></li>
              <li><a href="#" className="text-cream/70 hover:text-mint transition-colors font-medium">Mozilla.ai</a></li>
              <li><a href="#" className="text-cream/70 hover:text-mint transition-colors font-medium">Build With Otari Track</a></li>
            </ul>
          </div>

        </div>

        <div className="border-t-2 border-cream/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/50 text-sm font-medium">
            © 2026 IRIS Project. HackArena 2.0.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-mint"></div>
            <span className="text-cream/50 text-sm font-mono">Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
