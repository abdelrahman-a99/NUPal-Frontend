'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { useSmoothScroll } from '@/hooks/useSmoothScroll';

export function Footer() {
  const pathname = usePathname();
  const { scrollToId, scrollToTop } = useSmoothScroll(70);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (pathname === '/') {
      e.preventDefault();
      scrollToId(id);
    }
  };

  // Hide footer on specialized full-screen pages or by user request
  const isHidden = pathname.startsWith('/admin') || ['/login', '/chat', '/contact', '/404'].some(path => pathname === path || pathname?.startsWith('/chat/'));

  if (isHidden) {
    return null;
  }
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* DESKTOP VIEW - Original Layout */}
      <div className="hidden md:block mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Link
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToTop();
                }}
              >
                <Image src="/logo.svg" alt="NUPal" width={100} height={34} priority />
              </Link>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Empowering students to make informed academic decisions and achieve their educational goals.
            </p>
          </div>

          {/* Platform Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  Chatbot
                </Link>
              </li>
              <li>
                <Link
                  href="/career-hub"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  Career Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/#services"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'services')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'about')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'contact')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-400"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Media Column */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Follow Us</h3>
            <div className="flex gap-4">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-gradient-to-br hover:from-indigo-500 hover:to-blue-400 hover:text-white"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-gradient-to-br hover:from-indigo-500 hover:to-blue-400 hover:text-white"
                aria-label="Twitter"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-gradient-to-br hover:from-indigo-500 hover:to-blue-400 hover:text-white"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>

              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors hover:bg-gradient-to-br hover:from-indigo-500 hover:to-blue-400 hover:text-white"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="my-8 border-t border-slate-200 dark:border-slate-700" />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">© {new Date().getFullYear()} NUPal. All rights reserved.</p>
        </div>
      </div>

      {/* MOBILE VIEW - Refined Layout */}
      {/* MOBILE VIEW - Refined Layout - Compacted */}
      <div className="md:hidden mx-auto max-w-7xl px-6 py-6">
        {/* Logo & Description - Centered */}
        <div className="text-center mb-6">
          <Link
            href="/"
            onClick={(e) => {
              e.preventDefault();
              scrollToTop();
            }}
            className="inline-block mb-2"
          >
            <Image src="/logo.svg" alt="NUPal" width={90} height={30} priority />
          </Link>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
            Empowering students to make informed academic decisions and achieve their educational goals.
          </p>
        </div>

        {/* Links Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Platform Column */}
          <div className="text-center">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-blue-500">Platform</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  Chatbot
                </Link>
              </li>
              <li>
                <Link
                  href="/career-hub"
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  Career Hub
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="text-center">
            <h3 className="mb-4 text-xs font-black uppercase tracking-widest text-blue-500">Company</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/#services"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'services')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/#about"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'about')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/#contact"
                  scroll={false}
                  onClick={(e) => handleNavClick(e, 'contact')}
                  className="text-slate-600 dark:text-slate-300 transition hover:text-blue-500 font-medium"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media - Centered */}
        <div className="text-center mb-6">
          <h3 className="mb-3 text-xs font-black uppercase tracking-widest text-blue-500">Follow Us</h3>
          <div className="flex gap-3 justify-center">
            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
              aria-label="Facebook"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
              aria-label="Twitter"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </a>

            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
              aria-label="LinkedIn"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>

            <a
              href="#"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
              aria-label="Instagram"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Separator */}
        <div className="my-8 border-t border-slate-200 dark:border-slate-700" />

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">© {new Date().getFullYear()} NUPal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
