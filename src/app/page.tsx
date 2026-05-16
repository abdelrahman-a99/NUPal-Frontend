'use client';

import { useEffect, useState } from 'react';

import Hero from '@/components/home/Hero';
import ServicesSection from '../components/home/ServicesSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import AboutIntroSection from '@/components/home/AboutIntroSection';
import ContactSection from '@/components/home/ContactSection';
import HomeSkeleton from '@/components/home/HomeSkeleton';

import { useSmoothScroll } from '@/hooks/useSmoothScroll';

export default function Home() {
  const { scrollToId } = useSmoothScroll(70);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && !loading) {
      // Small delay to ensure content is rendered on initial mount
      const timer = setTimeout(() => {
        scrollToId(hash);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scrollToId, loading]);

  if (loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white dark:to-slate-950">
      <Hero />
      <ServicesSection />
      <FeaturesSection />
      <AboutIntroSection />
      <ContactSection />
    </div>
  );
}
