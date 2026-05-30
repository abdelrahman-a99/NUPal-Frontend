'use client';

import { features } from '@/data/features';
import Link from 'next/link';
import { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import Button from '../ui/Button';

export default function FeaturesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasMoved, setHasMoved] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);

    // Calculate progress
    const totalScrollable = scrollWidth - clientWidth;
    const progress = totalScrollable > 0 ? (scrollLeft / totalScrollable) * 100 : 0;
    setScrollProgress(progress);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    if (Math.abs(walk) > 5) setHasMoved(true);
    scrollRef.current.scrollLeft = scrollLeft - walk;
    checkScroll();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = 450;
    scrollRef.current.scrollTo({
      left: scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount),
      behavior: 'smooth'
    });
    // Check again after a short delay for smooth scroll to finish
    setTimeout(checkScroll, 400);
  };

  return (
    <section className="bg-slate-50/50 dark:bg-slate-900/50 py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-4xl tracking-tight mb-4">Platform Features</h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Discover the powerful tools that help you succeed in your academic journey and career planning.
            </p>
          </div>
          <div className="hidden lg:flex gap-2 pb-2">
            <Button
              variant="none"
              size="none"
              onClick={() => canScrollLeft && scroll('left')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${canScrollLeft
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 hover:bg-blue-100 active:scale-90 cursor-pointer'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-300 cursor-default opacity-50'
                }`}
              ariaLabel="Scroll left"
            >
              <ArrowLeft size={18} />
            </Button>
            <Button
              variant="none"
              size="none"
              onClick={() => canScrollRight && scroll('right')}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${canScrollRight
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-500 hover:bg-blue-100 active:scale-90 cursor-pointer'
                : 'bg-slate-50 dark:bg-slate-900/70 text-slate-300 cursor-default opacity-50'
                }`}
              ariaLabel="Scroll right"
            >
              <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onScroll={checkScroll}
        className="flex gap-8 overflow-x-auto pb-12 pt-4 no-scrollbar cursor-grab active:cursor-grabbing select-none scroll-smooth px-6 lg:px-[calc((100vw-1280px)/2+24px)]"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={feature.path}
            onClick={(e) => {
              if (hasMoved) {
                e.preventDefault();
              }
            }}
            className="group relative flex-shrink-0 w-[280px] sm:w-[380px] flex flex-col rounded-2xl bg-white dark:bg-slate-900 p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] hover:-translate-y-1 block overflow-hidden"
          >
            {/* Blue Accent Top Border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity" />

            <div className="mb-5 font-bold text-xs text-blue-500 tracking-widest uppercase">
              {feature.title.split(' ')[0]}
            </div>

            <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug">
              {feature.title}
            </h3>

            <p className="mb-8 text-base leading-relaxed text-slate-600 dark:text-slate-300">
              {feature.description}
            </p>

            <div
              className="inline-flex items-center gap-1 text-sm text-blue-500 font-bold mt-auto transition-colors duration-300 group-hover:text-black"
            >
              Learn more
              <ChevronRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
        {/* Extra spacing at the end */}
        <div className="flex-shrink-0 w-8 md:w-24" />
      </div>

      {/* Mobile Progress Bar Indicator */}
      <div className="lg:hidden flex justify-center mt-2 px-6">
        <div className="h-[2px] w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative">
          <div
            className="absolute top-0 h-full bg-blue-500 transition-all duration-150 rounded-full"
            style={{
              width: '35%',
              left: `${scrollProgress * 0.65}%` // 100 - 35 = 65
            }}
          />
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
