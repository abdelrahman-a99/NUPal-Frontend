'use client';

import { usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

export default function Hero() {
  const pathname = usePathname();
  const { scrollToId } = useSmoothScroll(70);

  const handleLearnMoreClick = (e: React.MouseEvent) => {
    if (pathname === '/') {
      e.preventDefault();
      scrollToId('about');
    }
  };

  return (
    <section id="home" className="relative isolate w-full overflow-hidden py-20">
      <div
        className="absolute inset-0 bg-cover bg-center blur-[0.05px]"
        style={{ backgroundImage: "url('/nile%202.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-slate-950 via-white/80 to-white/30" />

      <div className="relative z-10 mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center gap-10 px-6 py-10">
        <div className="max-w-3xl space-y-8 text-left">
          <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl">
            Your Academic Journey, <span className="text-blue-400">Simplified</span>
          </h1>
          <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200 lg:text-xl">
            AI-powered academic advising platform that helps you plan your courses, track your progress, and achieve
            your educational goals with confidence.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button href="/login" size="lg">
              GET STARTED
            </Button>
            <Button
              href="/#about"
              variant="outline"
              size="lg"
              onClick={handleLearnMoreClick}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
