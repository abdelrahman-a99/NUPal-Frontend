'use client';

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getToken, parseJwt, removeToken } from "@/lib/auth";
import { User, Settings, LogOut, Menu, X, Home, Briefcase, MessageSquare, Info, Mail, LayoutDashboard, ChevronRight, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import ProfileSettingsModal, { type ModalTab } from "@/components/layout/ProfileSettingsModal";

import { useSmoothScroll } from "@/hooks/useSmoothScroll";

interface NavLinkItem {
  name: string;
  path: string;
  id?: string;
  children?: { name: string; path: string; description?: string; icon?: React.ReactNode }[];
}

const navLinks: NavLinkItem[] = [
  { name: "Home", path: "/#home", id: "home" },
  { name: "Services", path: "/#services", id: "services" },
  { name: "About", path: "/#about", id: "about" },
  { name: "Contact", path: "/#contact", id: "contact" },
];

const dashboardLinks: NavLinkItem[] = [
  { name: "Dashboard", path: "/dashboard", id: "dashboard" },
  { name: "Chatbot", path: "/chat", id: "chat" },
  { name: "Scheduling", path: "/scheduling", id: "scheduling" },
  { 
    name: "Career Hub", 
    path: "/career-hub", 
    id: "career-hub",
    children: [
      { 
        name: "Find Jobs", 
        path: "/career-hub?tab=find-jobs",
        description: "Browse openings tailored to your skills",
      },
      { 
        name: "AI Resume Tools", 
        path: "/career-hub?tab=resume-checking",
        description: "Check CV, Job Match & AI Interview",
      }
    ]
  },
];

function NavbarInner() {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'student' | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('profile');

  const openModal = (tab: ModalTab) => {
    setModalTab(tab);
    setModalOpen(true);
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  };
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scrollToId, scrollToTop } = useSmoothScroll(70);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for Scroll Spy
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('home');
      return;
    }

    const options = {
      root: null,
      rootMargin: '-100px 0px -40% 0px',
      threshold: 0,
    };

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    let observer: IntersectionObserver | null = null;
    let timeoutId: NodeJS.Timeout;

    const setupObserver = () => {
      const sections = navLinks
        .filter(link => !!link.id)
        .map(link => document.getElementById(link.id!))
        .filter(Boolean);

      if (sections.length > 0) {
        observer = new IntersectionObserver(handleIntersect, options);
        sections.forEach(section => observer?.observe(section!));
      } else {
        // If sections not found (e.g. during loading), try again after a delay
        timeoutId = setTimeout(setupObserver, 500);
      }
    };

    setupObserver();

    return () => {
      observer?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Click outside listener for profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const token = getToken();
      if (token) {
        const parsed = parseJwt(token);
        setUserName(parsed?.name ?? null);
        setUserRole(parsed?.role ?? null);
      } else {
        setUserName(null);
        setUserRole(null);
      }
    } catch {
      setUserName(null);
      setUserRole(null);
    }
  }, []);

  if (!mounted) {
    // Render a consistent placeholder on the server and first client paint
    // to avoid hydration mismatches caused by auth state / searchParams
    return <div className="h-16" aria-hidden="true" />;
  }

  if (pathname === '/login' || pathname.startsWith('/admin')) {
    return null;
  }

  const initial = (userName?.trim()?.charAt(0)?.toUpperCase() ?? '');

  const isStudentArea = pathname.startsWith('/dashboard') || pathname.startsWith('/chat') || pathname.startsWith('/career-hub') || pathname.startsWith('/interview') || pathname.startsWith('/scheduling') || pathname.startsWith('/profile') || pathname.startsWith('/settings');
  const links = (userName || isStudentArea)
    ? (userRole === 'admin' ? navLinks : dashboardLinks)
    : navLinks;

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, id?: string) => {
    if (pathname === '/' && id) {
      e.preventDefault();
      scrollToId(id);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-sm transition-colors duration-300 ${isScrolled
          ? "border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 shadow-md"
          : "border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-slate-900/20 text-slate-900 dark:text-slate-100 shadow-sm"
          }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                scrollToTop();
                setMobileMenuOpen(false);
              }}
            >
              <Image src="/logo.svg" alt="NUPal" width={100} height={34} priority />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <nav
              className="hidden lg:flex items-center gap-10 text-sm font-semibold text-slate-600 dark:text-slate-300"
            >
              {links.map((link) => {
                const isActive = link.path.includes('#')
                  ? (pathname === '/' && activeSection === link.id)
                  : (pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path)));

                if (link.children) {
                  return (
                    <div key={link.path} className="relative group">
                        <span 
                            className={`flex items-center gap-1 transition-colors duration-200 cursor-pointer hover:text-blue-500 p-2 -m-2 ${isActive ? "text-blue-500" : ""}`}
                        >
                            {link.name}
                            <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
                        </span>
                        {/* Invisible hover bridge to prevent menu from closing when moving mouse */}
                        <div className="absolute top-full left-0 w-full h-4"></div>
                        {/* Dropdown Menu */}
                        <div className="absolute top-[calc(100%+0.5rem)] left-0 w-72 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-slate-100 dark:border-slate-800 p-2 z-50">
                            {link.children.map(child => {
                                const currentTab = searchParams.get('tab');
                                const isChildActive = child.path.includes('tab=find-jobs') 
                                  ? currentTab === 'find-jobs'
                                  : (pathname === '/career-hub' && currentTab !== 'find-jobs');
                                
                                return (
                                <Link 
                                    key={child.path} 
                                    href={child.path} 
                                    className={`flex flex-col gap-0.5 p-3.5 rounded-xl transition-all duration-200 group/child ${
                                      isChildActive ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                >
                                    <span className={`text-sm font-semibold leading-none transition-colors duration-200 ${
                                      isChildActive ? "text-blue-500" : "text-slate-600 dark:text-slate-300 group-hover/child:text-blue-500"
                                    }`}>
                                      {child.name}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
                                      {child.description}
                                    </span>
                                </Link>
                                );
                            })}
                        </div>
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={(e) => {
                      const id = link.id;
                      if (id) {
                        handleNavClick(e, link.path, id);
                      }
                    }}
                    className={`transition-colors duration-200 hover:text-blue-500 ${isActive ? "text-blue-500" : ""}`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <button
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {(userName || isStudentArea || pathname === '/404') ? (
            <div className="hidden lg:block relative" ref={menuRef}>
              <Button
                variant="none"
                size="none"
                onClick={() => setProfileMenuOpen((v: boolean) => !v)}
                ariaLabel="Open profile menu"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow"
              >
                <span className="text-sm font-semibold">{initial}</span>
              </Button>

              {profileMenuOpen && (
                <div role="menu" aria-label="Profile menu" className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 p-2 shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-3 rounded-lg bg-slate-50/70 dark:bg-slate-900/70 px-3 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <span className="text-sm font-semibold">{initial}</span>
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{userName ?? 'User'}</div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">Account</div>
                    </div>
                  </div>

                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />
                  <Button
                    href={userRole === 'admin' ? "/admin" : undefined}
                    variant="none"
                    size="none"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start"
                    onClick={() => userRole === 'admin' ? setProfileMenuOpen(false) : openModal('profile')}
                    role="menuitem"
                  >
                    <User size={16} aria-hidden="true" />
                    <span>{userRole === 'admin' ? "Admin Dashboard" : "Profile"}</span>
                  </Button>

                  <Button
                    variant="none"
                    size="none"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 justify-start"
                    onClick={() => openModal('settings')}
                    role="menuitem"
                  >
                    <Settings size={16} aria-hidden="true" />
                    <span>Settings</span>
                  </Button>

                  <div className="my-2 h-px bg-slate-200 dark:bg-slate-700" />

                  <Button
                    variant="none"
                    size="none"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 dark:text-red-300 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/50 justify-start"
                    onClick={() => {
                      removeToken();
                      window.location.href = '/';
                    }}
                    role="menuitem"
                  >
                    <LogOut size={16} aria-hidden="true" />
                    <span>Logout</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:block">
              <Button
                href="/login"
                size="md"
                className="px-6"
              >
                LOGIN
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay - Solid Full Screen Re-design */}
      <div
        className={`lg:hidden fixed inset-0 z-[9999] bg-white dark:bg-slate-900 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          }`}
      >
        <div className="flex flex-col h-full bg-white dark:bg-slate-900">
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <Image src="/logo.svg" alt="NUPal" width={90} height={30} priority />
            <button
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-full transition-colors border border-slate-100 dark:border-slate-800 shadow-sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col pt-4 overflow-y-auto">
            <div className="flex flex-col">
              {links.map((link, index) => {
                const isActive = link.path.includes('#')
                  ? (pathname === '/' && activeSection === link.id)
                  : (pathname === link.path || (link.path !== '/' && pathname.startsWith(link.path)));

                if (link.children) {
                    return (
                        <div key={link.path} className="border-b border-dashed border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="flex items-center justify-between px-6 py-5 cursor-default">
                                <span className={`font-bold text-lg ${isActive ? "text-blue-500" : "text-slate-800 dark:text-slate-100"}`}>{link.name}</span>
                                <ChevronDown size={20} className="text-slate-400 dark:text-slate-400" />
                            </div>
                            <div className="flex flex-col bg-slate-50/50 dark:bg-slate-900/50 pb-2">
                                {link.children.map(child => {
                                    const currentTab = searchParams.get('tab');
                                    const isChildActive = child.path.includes('tab=find-jobs') 
                                      ? currentTab === 'find-jobs'
                                      : (pathname === '/career-hub' && currentTab !== 'find-jobs');

                                    return (
                                        <Link
                                            key={child.path}
                                            href={child.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex flex-col gap-1 px-10 py-3.5 transition-colors ${isChildActive ? "text-blue-500" : "text-slate-600 dark:text-slate-300"}`}
                                        >
                                            <span className="font-semibold text-sm">{child.name}</span>
                                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-400">{child.description}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }

                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={(e) => {
                      const id = link.id;
                      if (id && pathname === '/') {
                        handleNavClick(e, link.path, id);
                      }
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center justify-between px-6 py-5 border-b border-dashed border-slate-100 dark:border-slate-800 transition-colors duration-200 ${isActive ? "text-blue-500" : "text-slate-800 dark:text-slate-100"
                      }`}
                  >
                    <span className="font-bold text-lg">{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Mobile-Native Account Section */}
            <div className="mt-auto px-4 py-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
              {(userName || isStudentArea || pathname === '/404') ? (
                <div className="space-y-3">
                  {/* User Info - Horizontal Layout */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                      <span className="text-base font-bold">{initial}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{userName ?? 'User'}</div>
                      <div className="truncate text-xs text-slate-500 dark:text-slate-400">My Account</div>
                    </div>
                  </div>

                  {/* Action Buttons - Side by Side */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      href={userRole === 'admin' ? "/admin" : undefined}
                      variant="none"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 text-center transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-blue-300 active:scale-95 shadow-sm"
                      onClick={() => userRole === 'admin' ? setMobileMenuOpen(false) : openModal('profile')}
                    >
                      <User size={20} className="text-blue-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{userRole === 'admin' ? "Admin Dashboard" : "Profile"}</span>
                    </Button>

                    <Button
                      variant="none"
                      className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-3 text-center transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-300 active:scale-95 shadow-sm"
                      onClick={() => {
                        removeToken();
                        window.location.href = '/';
                      }}
                    >
                      <LogOut size={20} className="text-red-500" />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Logout</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Button
                    href="/login"
                    variant="primary"
                    className="w-full py-4 rounded-xl font-bold text-sm bg-blue-400 hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile / Settings Modal */}
      <ProfileSettingsModal
        open={modalOpen}
        defaultTab={modalTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<div className="h-16" aria-hidden="true" />}>
      <NavbarInner />
    </Suspense>
  );
}
