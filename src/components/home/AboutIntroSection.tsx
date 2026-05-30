'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function AboutIntroSection() {
  return (
    <section id="about" className="relative bg-white dark:bg-slate-900 pt-16 pb-24 overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* DESKTOP VIEW - Original Layout */}
      <div className="hidden lg:block mx-auto max-w-7xl px-6 relative z-10">
        <div className="mb-20">
          <div className="inline-block mb-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-blue-400">About Us</span>
            <div className="mt-2 h-1 w-16 bg-gradient-to-r from-blue-400 to-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-3xl max-w-3xl leading-tight">NUPal empowers everyone to build their academic success</h2>
        </div>
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="relative">
            <div className="relative overflow-hidden">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-indigo-600 to-purple-600 rounded-full" />
              <div className="relative">
                <div className="relative overflow-hidden rounded-3xl group shadow-2xl">
                  <Image src="/nile4.jpg" alt="Nile University Campus" width={800} height={600} className="w-full h-auto object-cover rounded-3xl transition-transform duration-700 group-hover:scale-105" style={{ minHeight: '400px', maxHeight: '600px' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none rounded-3xl" />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" />
                <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200">NUPal is a cutting-edge academic advising platform that leverages artificial intelligence to transform how students navigate their educational journey. </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-600" />
                <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300">We empower students to make confident, informed decisions about their academic path. Through intelligent course recommendations, comprehensive progress tracking, and intuitive semester planning tools, NU PAL eliminates the complexity and uncertainty from academic planning.</p>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 pb-8 sm:pb-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4">
                <Link href="/chat" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center transition-colors group-hover:bg-blue-200">
                    <span className="text-blue-400 text-[10px] font-bold">AI</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap group-hover:text-blue-500 transition-colors">AI-Powered</span>
                </Link>

                <Link href="/dashboard" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center transition-colors group-hover:bg-indigo-200">
                    <span className="text-indigo-600 text-[10px] font-bold">P</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap group-hover:text-indigo-500 transition-colors">Personalized</span>
                </Link>

                <Link href="/dashboard" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center transition-colors group-hover:bg-purple-200">
                    <span className="text-purple-600 text-[10px] font-bold">C</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap group-hover:text-purple-500 transition-colors">Comprehensive</span>
                </Link>

                <Link href="/dashboard" className="flex items-center gap-3 group">
                  <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center transition-colors group-hover:bg-blue-200">
                    <span className="text-blue-400 text-[10px] font-bold">I</span>
                  </div>
                  <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap group-hover:text-blue-500 transition-colors">Intuitive</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE VIEW - Refined Layout */}
      <div className="lg:hidden mx-auto max-w-7xl px-6 relative z-10">
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-blue-500">About Us</span>
            <div className="mt-2 h-1 w-12 bg-blue-500 mx-auto rounded-full" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-[1.15] tracking-tight">
            NUPal empowers everyone to build their academic success
          </h2>
        </div>
        <div className="space-y-12">
          {/* Image First */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-[2.5rem] group shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800">
              <Image
                src="/nile4.jpg"
                alt="Nile University Campus"
                width={800}
                height={600}
                className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110"
                style={{ minHeight: '350px', maxHeight: '550px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-sm font-bold uppercase tracking-widest opacity-80 mb-1">Our Mission</p>
                <p className="text-xl font-bold">Innovation in Education</p>
              </div>
            </div>
          </div>

          {/* Text Second */}
          <div className="space-y-10">
            <div className="space-y-6 text-center">
              <p className="text-base sm:text-lg leading-relaxed text-slate-700 dark:text-slate-200 font-medium">
                NUPal is a cutting-edge academic advising platform that leverages artificial intelligence to transform how students navigate their educational journey.
              </p>
              <p className="text-sm sm:text-base leading-relaxed text-slate-500 dark:text-slate-400">
                We empower students to make confident, informed decisions about their academic path. Through intelligent course recommendations, comprehensive progress tracking, and intuitive semester planning tools, NUPal eliminates the complexity and uncertainty from academic planning.
              </p>
            </div>
            <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-y-8 gap-x-4 sm:grid-cols-4">
                <Link href="/chat" className="flex flex-col items-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center transition-all duration-300 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30">
                    <span className="text-blue-500 text-xs font-black group-hover:text-white transition-colors">AI</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest group-hover:text-blue-500 transition-colors text-center">AI-Powered</span>
                </Link>

                <Link href="/dashboard" className="flex flex-col items-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center transition-all duration-300 group-hover:bg-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-600/30">
                    <span className="text-indigo-600 text-xs font-black group-hover:text-white transition-colors">P</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors text-center">Personalized</span>
                </Link>

                <Link href="/dashboard" className="flex flex-col items-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center transition-all duration-300 group-hover:bg-purple-600 group-hover:shadow-lg group-hover:shadow-purple-600/30">
                    <span className="text-purple-600 text-xs font-black group-hover:text-white transition-colors">C</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest group-hover:text-purple-600 transition-colors text-center">Comprehensive</span>
                </Link>

                <Link href="/dashboard" className="flex flex-col items-center gap-3 group">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 flex items-center justify-center transition-all duration-300 group-hover:bg-cyan-500 group-hover:shadow-lg group-hover:shadow-cyan-500/30">
                    <span className="text-cyan-500 text-xs font-black group-hover:text-white transition-colors">I</span>
                  </div>
                  <span className="text-xs font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest group-hover:text-cyan-500 transition-colors text-center">Intuitive</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
