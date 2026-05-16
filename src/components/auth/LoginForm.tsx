'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { API_ENDPOINTS } from '@/config/api';
import Button from '@/components/ui/Button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [err, setErr] = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr('');
    try {
      const res = await fetch(`${API_ENDPOINTS.STUDENTS}/login`, {

        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data: any = {};
      const textData = await res.text();
      if (textData) {
        try {
          data = JSON.parse(textData);
        } catch (_) {
          throw new Error(`Invalid JSON response (Status: ${res.status}). Body: ${textData.substring(0, 100)}`);
        }
      }

      if (!res.ok) {
        setErr(data?.error || `Login failed with status ${res.status}`);
      } else {
        if (data?.token) {
          const { setToken, parseJwt } = await import('@/lib/auth');
          setToken(data.token);

          // Route based on the role claim in the JWT
          const user = parseJwt(data.token);
          window.location.href = user?.role === 'admin' ? '/admin' : '/dashboard';
        } else {
          setErr('Login succeeded but no token returned.');
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Network error';
      setErr(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen bg-white dark:bg-slate-900 relative overflow-hidden overflow-x-hidden flex items-center justify-center px-6">
      <div className="absolute bottom-0 left-0 right-0 h-[700px] overflow-hidden pointer-events-none">
        <svg
          className="absolute bottom-0 w-full h-full"
          viewBox="0 0 1440 700"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,200L60,190C120,180,240,160,360,150C480,140,600,140,720,155C840,170,960,200,1080,210C1200,220,1320,210,1380,205L1440,200L1440,700L1380,700C1320,700,1200,700,1080,700C960,700,840,700,720,700C600,700,480,700,360,700C240,700,120,700,60,700L0,700Z"
            fill="url(#gradient1-login)"
            style={{ animation: 'waveFloat 6s ease-in-out infinite' }}
          />
          <path
            d="M0,250L40,245C80,240,160,230,240,225C320,220,400,220,480,230C560,240,640,260,720,270C800,280,880,280,960,275C1040,270,1120,260,1200,255C1280,250,1360,250,1400,250L1440,250L1440,700L1400,700C1360,700,1280,700,1200,700C1120,700,1040,700,960,700,880,700,800,700,720,700,640,700,560,700,480,700,400,700,320,700,240,700,160,700,80,700,40,700L0,700Z"
            fill="url(#gradient2-login)"
            style={{ animation: 'waveFloat 8s ease-in-out infinite', animationDelay: '0.4s' }}
          />
          <path
            d="M0,300L50,295C100,290,200,280,300,275C400,270,500,270,600,280C700,290,800,310,900,320C1000,330,1100,330,1200,325C1300,320,1400,310,1450,305L1500,300L1500,700L1450,700C1400,700,1300,700,1200,700C1100,700,1000,700,900,700,800,700,700,700,600,700,500,700,400,700,300,700,200,700,100,700,50,700L0,700Z"
            fill="url(#gradient3-login)"
            style={{ animation: 'waveFloat 10s ease-in-out infinite', animationDelay: '0.8s' }}
          />
          <path
            d="M0,350L30,348C60,346,120,342,180,340C240,338,300,338,360,342C420,346,480,354,540,358C600,362,660,362,720,360C780,358,840,354,900,352C960,350,1020,350,1080,352C1140,354,1200,358,1260,360C1320,362,1380,362,1410,362L1440,362L1440,700L1410,700C1380,700,1320,700,1260,700,1200,700,1140,700,1080,700,1020,700,960,700,900,700,840,700,780,700,720,700,660,700,600,700,540,700,480,700,420,700,360,700C300,700,240,700,180,700,120,700,60,700,30,700L0,700Z"
            fill="url(#gradient4-login)"
            style={{ animation: 'waveFloat 12s ease-in-out infinite', animationDelay: '1.2s' }}
          />
          <defs>
            <linearGradient id="gradient1-login" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="gradient2-login" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="gradient3-login" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient id="gradient4-login" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e40af" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-l md:max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 md:p-8 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="Home" className="inline-block">
              <Image src="/logo.svg" alt="NUPal" width={100} height={34} priority className="cursor-pointer" />
            </Link>
          </div>
          {/* <Link
            href="/"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur ring-1 ring-slate-200 dark:ring-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-700 hover:bg-white dark:hover:bg-slate-800 transition"
            aria-label="Back to home"
          > */}
          {/* <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg> */}
          {/* </Link> */}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              placeholder="Email or ID"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-900 dark:text-slate-100">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-slate-100 shadow-sm transition-colors focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                placeholder="password"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isSubmitting ? 'LOGGING IN...' : 'LOGIN'}
          </Button>
        </form>
        {err && <div className="mt-4 text-red-600 dark:text-red-300 text-sm mb-2 text-center">{err}</div>}
      </div>
    </div>
  );
}
