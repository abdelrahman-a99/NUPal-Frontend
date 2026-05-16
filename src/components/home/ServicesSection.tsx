'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { services } from '@/data/services';
import Button from '../ui/Button';

export default function ServicesSection() {
    const [activeService, setActiveService] = useState(services[0].id);
    const [openService, setOpenService] = useState<string | null>(services[0].id);
    // Ref for the mobile tabs container
    const tabsContainerRef = useRef<HTMLDivElement>(null);

    // Scroll active tab into view when activeService changes
    useEffect(() => {
        if (tabsContainerRef.current) {
            const container = tabsContainerRef.current;
            const activeTab = container.querySelector(`[data-service-id="${activeService}"]`) as HTMLElement;

            if (activeTab) {
                const containerRect = container.getBoundingClientRect();
                const tabRect = activeTab.getBoundingClientRect();

                // Calculate the position to center the tab
                // We want the center of the tab to align with the center of the container
                // Current scrollLeft + (distance from left of container to left of tab) - (half container width) + (half tab width)
                const offset = tabRect.left - containerRect.left;
                const scrollLeft = container.scrollLeft + offset - (container.clientWidth / 2) + (tabRect.width / 2);

                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeService]);

    const handleServiceChange = (serviceId: string) => {
        setActiveService(serviceId);
        setOpenService(serviceId);
    };

    const handleServiceToggle = (serviceId: string) => {
        setOpenService(openService === serviceId ? null : serviceId);
        setActiveService(serviceId);
    };


    // Touch handling for mobile swipe
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null); // Reset touch end
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe || isRightSwipe) {
            const currentIndex = services.findIndex(s => s.id === activeService);
            let nextIndex;

            if (isLeftSwipe) {
                // Next service
                nextIndex = (currentIndex + 1) % services.length;
            } else {
                // Previous service
                nextIndex = (currentIndex - 1 + services.length) % services.length;
            }

            handleServiceChange(services[nextIndex].id);
        }
    };

    return (
        <section id="services" className="bg-white dark:bg-slate-900 pb-16 overflow-hidden">
            {/* DESKTOP VIEW - lg only */}
            <div className="hidden lg:block">
                <div className="border-b border-blue-200 dark:border-blue-800/60 bg-white dark:bg-slate-900">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="flex flex-wrap justify-center gap-3">
                            {services.map((service) => (
                                <Button
                                    key={service.id}
                                    variant="none"
                                    size="none"
                                    onClick={() => handleServiceChange(service.id)}
                                    className={`rounded-full px-6 py-2.5 text-sm font-semibold uppercase transition-all duration-200 whitespace-nowrap ${activeService === service.id
                                        ? 'bg-blue-400 text-white shadow-md shadow-blue-500/30'
                                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-400 hover:bg-blue-100'
                                        }`}
                                >
                                    {service.title}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mx-auto max-w-7xl px-6 pb-16 pt-8">
                    <div className="grid grid-cols-2 gap-0">
                        {/* Left: Accordion Area */}
                        <div className="relative z-10 space-y-0 border-r border-blue-200 dark:border-blue-800/60 pr-8">
                            {services.map((service) => {
                                const isOpen = openService === service.id;
                                return (
                                    <div key={service.id} className="border-b border-blue-200 dark:border-blue-800/60">
                                        <Button
                                            variant="none"
                                            size="none"
                                            onClick={() => handleServiceToggle(service.id)}
                                            className="flex w-full items-center justify-between py-6 text-left"
                                        >
                                            <div className="flex items-center gap-4 justify-start w-full">
                                                <div className={`h-1 w-1 rounded-full transition-all duration-300 ${isOpen ? 'h-12 w-1 bg-blue-400' : 'bg-blue-300'
                                                    }`} />
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{service.title}</h3>
                                            </div>
                                            <svg className={`h-5 w-5 text-slate-600 dark:text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </Button>
                                        <div className={`overflow-hidden transition-all duration-500 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="pb-6 pl-5">
                                                <p className="mb-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">{service.description}</p>
                                                <Link href={service.path} className="group inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 transition-all">
                                                    <span>Take a guided tour</span>
                                                    <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Right: Mockup Area with Peek Effect */}
                        <div className="relative aspect-[4/3] w-full ml-12 overflow-visible">
                            <div
                                className="absolute bottom-[-13%] left-0 w-[150vw] h-24 bg-blue-400/90 origin-left"
                                style={{
                                    transform: 'translateX(-48px) skewY(-7deg)',
                                    zIndex: 5
                                }}
                            />
                            <div className="absolute -top-20 -bottom-60 left-10 w-[120%] overflow-hidden rounded-xl z-10 pointer-events-none">
                                <div className="relative h-full w-full p-20">
                                    {services.map((service, serviceIndex) => {
                                        const isActive = activeService === service.id;
                                        const activeIndex = services.findIndex(s => s.id === activeService);
                                        const zIndex = 10 + serviceIndex;
                                        // Desktop Peek Logic: active is at 5%, future are at 100%
                                        const translateX = serviceIndex <= activeIndex ? '0%' : '100%';

                                        return (
                                            <div
                                                key={service.id}
                                                className="absolute inset-x-0   top-20 bottom-52 transition-transform duration-700 ease-in-out pointer-events-auto"
                                                style={{
                                                    transform: `translateX(${translateX})`,
                                                    zIndex: zIndex,
                                                }}
                                            >
                                                <div className={`h-full w-full border border-slate-200 dark:border-slate-700 flex flex-col rounded-xl overflow-hidden transition-all duration-300 ${isActive ? 'shadow-[0_25px_50px_-45px_rgba(0,0,0,0.25)]' : ''}`} style={{ backgroundColor: service.id === 'career-hub' ? '#F5F3EF' : 'white' }}>
                                                    {/* Browser Header */}
                                                    <div className="flex items-center gap-4 px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                                        <div className="flex gap-1.5">
                                                            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                            <div className="h-2 w-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <div
                                                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded py-0.5 px-3 text-[10px] text-slate-400 dark:text-slate-400 font-medium tracking-tight shadow-sm text-left"
                                                                dir="ltr"
                                                            >
                                                                nupal.edu/{service.id.replace('academic-map', 'dashboard').replace('academic-plan', 'dashboard').replace('tracks-map', 'dashboard')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Image Content */}
                                                    <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 p-0">
                                                        <Image
                                                            src={service.image}
                                                            alt={service.title}
                                                            width={800}
                                                            height={600}
                                                            className={`h-full w-full transition-all duration-500 ${service.id === 'chatbot' || service.id === 'career-hub' ? 'object-cover object-left-top' : 'object-contain'
                                                                }`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div >
                        </div >
                    </div >
                </div >
            </div >

            {/* MOBILE VIEW - lg:hidden only */}
            < div className="lg:hidden flex flex-col pt-8" >
                {/* 1. Image Mockup on Top */}
                < div
                    className="relative aspect-[4/3] w-full overflow-hidden mb-8 touch-pan-y"
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div className="relative h-full w-full">
                        {services.map((service, serviceIndex) => {
                            const isActive = activeService === service.id;
                            const activeIndex = services.findIndex(s => s.id === activeService);
                            const zIndex = 10 + serviceIndex;

                            // Mobile Logic: Strictly 0% for active, 100% for future, -100% for past (to hide completely)
                            const translateX = isActive ? '0%' : (serviceIndex < activeIndex ? '-100%' : '100%');
                            const opacity = isActive ? 'opacity-100' : 'opacity-0';

                            return (
                                <div
                                    key={service.id}
                                    className={`absolute inset-0 p-6 transition-all duration-500 ease-in-out ${opacity}`}
                                    style={{
                                        transform: `translateX(${translateX})`,
                                        zIndex: zIndex,
                                    }}
                                >
                                    <div className="h-full w-full border border-slate-200 dark:border-slate-700 flex flex-col rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: service.id === 'career-hub' ? '#f7f8facb' : 'white' }}>
                                        {/* Browser Header */}
                                        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                            <div className="flex gap-1.5">
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded py-0.5 px-2 text-[8px] text-slate-400 dark:text-slate-400 text-center truncate">
                                                    nupal.edu/{service.id}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden p-0">
                                            <Image
                                                src={service.image}
                                                alt={service.title}
                                                width={400}
                                                height={300}
                                                className={`h-full w-full transition-all duration-300 ${service.id === 'chatbot'
                                                    ? 'object-contain object-left scale-[1.4] origin-left'
                                                    : 'object-contain object-center'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div >

                {/* 2. Horizontal Tab Navigation (Pill-style like desktop) */}
                < div className="px-6 mb-8 overflow-x-auto no-scrollbar" ref={tabsContainerRef} >
                    <div className="flex gap-2 min-w-max pb-2">
                        {services.map((service) => {
                            const isActive = activeService === service.id;
                            return (
                                <Button
                                    key={service.id}
                                    variant="none"
                                    size="none"
                                    data-service-id={service.id}
                                    onClick={() => handleServiceChange(service.id)}
                                    className={`rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap border ${isActive
                                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/30 active:scale-95'
                                        : 'bg-blue-50/50 text-blue-500 border-blue-100/30'
                                        }`}
                                >
                                    {service.title}
                                </Button>
                            );
                        })}
                    </div>
                </div >

                {/* 3. Single Content Card (Focused like desktop) */}
                < div className="px-6 mb-12" >
                    <div className="rounded-[2rem] bg-white dark:bg-slate-900 p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] border border-slate-50 dark:border-slate-800 relative overflow-hidden h-[240px] flex flex-col items-center justify-center text-center">
                        {services.map((service) => {
                            const isActive = activeService === service.id;
                            if (!isActive) return null;
                            return (
                                <div key={service.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed text-sm font-medium">
                                        {service.description}
                                    </p>
                                    <Link
                                        href={service.path}
                                        className="inline-block text-blue-500 font-bold border-b-2 border-blue-100 dark:border-blue-900/50 hover:border-blue-500 transition-all pb-1 mb-2 text-xs tracking-wide"
                                    >
                                        Take a guided tour
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </div >
            </div >
        </section >
    );
}
