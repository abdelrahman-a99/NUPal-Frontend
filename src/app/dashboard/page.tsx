'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, parseJwt, removeToken } from '../../lib/auth';
import DashboardCard from '../../components/dashboard/DashboardCard';
import Button from '../../components/ui/Button';
import { getStudentByEmail, StudentResponse } from '../../services/studentService';
import { MessageSquare, ArrowRight, ChevronRight, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { useRef } from 'react';
import AcademicMindMap from '../../components/dashboard/AcademicMindMap';
import GPAProgressChart from '../../components/dashboard/GPAProgressChart';
import AIAvatar from '../../components/dashboard/AIAvatar';
import AcademicPlanBoard from '../../components/dashboard/AcademicPlanBoard';
import DashboardSkeleton from '../../components/dashboard/DashboardSkeleton';


export default function DashboardPage() {
    const router = useRouter();
    const [studentData, setStudentData] = useState<StudentResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState('01');
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [aiCardMousePos, setAiCardMousePos] = useState({ x: 0, y: 0 });
    const [aiCardIsActive, setAiCardIsActive] = useState(false);
    const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

    const handleAiMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        setAiCardMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleAiMouseEnter = () => {
        setAiCardIsActive(true);
    };

    const handleAiMouseLeave = () => {
        setAiCardIsActive(false);
    };

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const token = getToken();
                if (!token) {
                    router.push('/login');
                    return;
                }

                const user = parseJwt(token);
                if (!user || !user.email) {
                    removeToken();
                    router.push('/login');
                    return;
                }

                if (user.role === 'admin') {
                    router.push('/admin');
                    return;
                }

                // Fetch student data from API
                const data = await getStudentByEmail(user.email);
                if (!data) {
                    setError('Student data not found');
                    setLoading(false);
                    return;
                }

                setStudentData(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching student data:', err);
                setError('Failed to load student data');
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [router]);

    // Theme Management - Ensure synchronization with localStorage settings
    useEffect(() => {
        const syncTheme = () => {
            try {
                const raw = localStorage.getItem('nupal_student_settings');
                if (raw) {
                    const s = JSON.parse(raw);
                    const isDark = s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                    if (isDark) {
                        document.documentElement.classList.add('dark', 'dark-mode');
                    } else {
                        document.documentElement.classList.remove('dark', 'dark-mode');
                    }
                }
            } catch (e) {}
        };

        syncTheme();
        window.addEventListener('nupal-settings-updated', syncTheme);
        window.addEventListener('storage', syncTheme);
        return () => {
            window.removeEventListener('nupal-settings-updated', syncTheme);
            window.removeEventListener('storage', syncTheme);
        };
    }, []);

    useEffect(() => {
        if (!studentData) return;
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -20% 0px', // More precise triggering area
            threshold: 0.6 // Require 60% visibility to activate
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('data-section-id');
                    if (id) {
                        setActiveSection(id);
                    }
                }
            });
        }, observerOptions);

        sectionRefs.current.forEach((section) => {
            if (section) observer.observe(section);
        });

        return () => {
            sectionRefs.current.forEach((section) => {
                if (section) observer.unobserve(section);
            });
        };
    }, [studentData]); // Re-run if studentData changes

    // Calculate statistics
    const stats = studentData ? {
        totalCredits: studentData.education.totalCredits,
        cumulativeGPA: studentData.education.semesters[studentData.education.semesters.length - 1]?.cumulativeGpa || 0,
        numSemesters: studentData.education.numSemesters,
        totalCourses: studentData.education.semesters.reduce((acc, sem) => acc + sem.courses.length, 0),
        latestSemesterGPA: studentData.education.semesters[studentData.education.semesters.length - 1]?.semesterGpa || 0
    } : null;

    if (loading) {
        return <DashboardSkeleton />;
    }

    if (error || !studentData) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-red-500">{error || 'Failed to load data'}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="hidden md:block">
                {/* Top Section: Header with Light Gray Background and Curve */}
                <div className="relative bg-slate-100 pt-16 pb-32 px-6 md:px-10 overflow-hidden">
                    {/* SVG Curve at the bottom */}
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                        <svg
                            className="relative block w-full h-[60px]"
                            data-name="Layer 1"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 1200 120"
                            preserveAspectRatio="none"
                        >
                            <path
                                d="M600,112.77C268.63,112.77,0,65.52,0,7.23V120H1200V7.23C1200,65.52,931.37,112.77,600,112.77Z"
                                className="fill-white"
                            ></path>
                        </svg>
                    </div>

                    <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        {/* Welcome Message */}
                        <div className="flex-shrink-0">
                            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
                                Hi, {studentData.account.name}
                            </h1>
                            <p className="text-slate-500 text-lg mt-2">Welcome back to your academic portal</p>
                        </div>
                    </div>
                </div>

                {/* Content Section: Stats Strip */}
                <div className="px-6 md:px-10 -mt-6 relative z-20">
                    <div className="max-w-5xl mx-auto">
                        {/* Stats Grid - Unified Strip Style (Zero Gaps) */}
                        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden min-h-[140px]">
                            <div className="flex-1">
                                <DashboardCard
                                    title="Overall GPA"
                                    value={stats?.cumulativeGPA.toFixed(2) || '0.00'}
                                />
                            </div>
                            <div className="flex-1">
                                <DashboardCard
                                    title="Latest semester"
                                    value={stats?.latestSemesterGPA.toFixed(2) || '0.00'}
                                />
                            </div>
                            <div className="flex-1">
                                <DashboardCard
                                    title="Enrolled credits"
                                    value={stats?.totalCredits.toString() || '0'}
                                />
                            </div>

                            <div className="flex-1">
                                <DashboardCard
                                    title="Total courses"
                                    value={stats?.totalCourses.toString() || '0'}
                                />
                            </div>
                            <div className="flex-1">
                                <DashboardCard
                                    title="Semesters"
                                    value={stats?.numSemesters.toString() || '0'}
                                />
                            </div>



                        </div>
                    </div>

                    {/* Widened Lower Sections */}
                    <div className="max-w-screen-xl mx-auto">
                        {/* Feature Showcase Section - Matching reference style */}
                        <div className="mt-32 mb-10 w-full relative">
                            {/* Visual Separator */}
                            <div className="w-full h-px bg-slate-100 absolute -top-16 left-0"></div>

                            <div className="max-w-4xl mx-auto md:mx-0 text-center md:text-left mb-20">
                                <h2 className="text-4xl md:text-5xl font-2xl text-slate-900 mb-6 tracking-tight">
                                    Advanced tools to master your academic journey
                                </h2>
                                <p className="text-slate-500 text-lg md:text-xl max-w-2xl leading-relaxed">
                                    Everything you need to track, plan, and optimize your university experience in one sleek, intelligent dashboard.
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-12 items-start">
                                <div className="md:sticky md:top-32 w-full md:w-64 space-y-6 flex-shrink-0">
                                    <div className="space-y-4">
                                        {[
                                            { id: '01', label: 'Academic Map' },
                                            { id: '02', label: 'GPA Progress' },
                                            { id: '03', label: 'AI Optimization' }
                                        ].map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => {
                                                    const el = document.querySelector(`[data-section-id="${item.id}"]`);
                                                    if (el) {
                                                        const top = el.getBoundingClientRect().top + window.pageYOffset - 120;
                                                        window.scrollTo({ top, behavior: 'smooth' });
                                                    }
                                                }}
                                                className={`group cursor-pointer flex items-center gap-4 py-3 border-b transition-all ${activeSection === item.id ? 'border-blue-600' : 'border-slate-100 hover:border-slate-300'}`}
                                            >
                                                <span className={`text-xs font-bold transition-colors ${activeSection === item.id ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                    {item.id}
                                                </span>
                                                <span className={`text-base font-semibold transition-colors ${activeSection === item.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                                    {item.label}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Side - Stacked Content Cards */}
                                <div className="flex-1 space-y-16 w-full">
                                    {[
                                        {
                                            id: '01',
                                            title: 'Academic Map',
                                            description: 'Visualize your entire academic journey in a single, interactive knowledge graph.',
                                            bgColor: 'bg-slate-700',
                                            isDark: true,
                                            image: '/academic_analytics_showcase_1766429718855.png'
                                        },
                                        {
                                            id: '02',
                                            title: 'GPA Progress Tracking',
                                            description: 'Monitor your academic growth with visualized semester and cumulative GPA trends. See your improvement over the years at a glance.',
                                            bgColor: 'bg-[#064E3B]',
                                            isDark: true,
                                            image: '/career_pathways_showcase_1766429734698.png'
                                        },
                                        {
                                            id: '03',
                                            title: "Don't just plan. Optimize.",
                                            description: 'Get AI-driven recommendations for your upcoming semesters. Our assistant analyzes your path to find the perfect course load.',
                                            bgColor: 'bg-[#D1E9F6]',
                                            isDark: false,
                                            image: ''
                                        }
                                    ].map((feature, idx) => (
                                        <div
                                            key={feature.id}
                                            ref={(el) => { sectionRefs.current[idx] = el; }}
                                            data-section-id={feature.id}
                                            className={`${feature.bgColor} rounded-[2rem] ${feature.id === '01' ? 'p-4 md:p-9' : 'p-8 md:p-14'} min-h-[420px] flex flex-col relative overflow-hidden group transition-all duration-700 ${!feature.isDark ? 'border border-slate-200/50' : ''}`}
                                            onMouseMove={feature.id === '03' ? handleAiMouseMove : undefined}
                                            onMouseEnter={feature.id === '03' ? handleAiMouseEnter : undefined}
                                            onMouseLeave={feature.id === '03' ? handleAiMouseLeave : undefined}
                                        >
                                            {/* Content Area: Illustration / Chart / Map */}
                                            <div className={`${feature.id === '03' ? 'order-first mb-6' : 'order-last mt-auto'} relative w-full rounded-2xl overflow-hidden border glass-effect ${feature.id === '01' ? 'h-[500px]' : feature.id === '03' ? 'h-[280px] !bg-transparent !border-none !shadow-none' : feature.id === '02' ? 'h-[400px]' : 'h-48 md:h-60'} ${feature.isDark ? 'border-white/10' : 'border-slate-900/5'}`}>
                                                {feature.id === '01' ? (
                                                    <AcademicMindMap
                                                        data={studentData}
                                                        selectedTrackId={selectedTrackId}
                                                        onBackToPersonal={() => setSelectedTrackId(null)}
                                                    />
                                                ) : feature.id === '02' ? (
                                                    <GPAProgressChart data={studentData} />
                                                ) : feature.id === '03' ? (
                                                    <AIAvatar
                                                        mouseX={aiCardMousePos.x}
                                                        mouseY={aiCardMousePos.y}
                                                        isActive={aiCardIsActive}
                                                    />
                                                ) : (
                                                    <>
                                                        <img
                                                            src={feature.image}
                                                            alt={feature.title}
                                                            className={`w-full h-full object-cover transition-opacity duration-700 opacity-90 group-hover:opacity-100`}
                                                        />
                                                        <div className={`absolute inset-0 bg-gradient-to-t from-slate-900/10 to-transparent`}></div>
                                                    </>
                                                )}
                                            </div>

                                            {/* Text Info Box */}
                                            <div className={`flex justify-between items-end relative z-10 ${feature.id === '03' ? 'order-last' : 'order-first mb-6'}`}>
                                                <div className="max-w-2xl">
                                                    <h4 className={`text-2xl md:text-3xl font-bold mb-3 leading-tight ${feature.isDark ? 'text-white' : 'text-slate-900'}`}>
                                                        {feature.title}
                                                    </h4>
                                                    <p className={`text-base md:text-lg leading-relaxed max-w-xl ${feature.isDark ? 'text-white/70' : 'text-slate-600'}`}>
                                                        {feature.description}
                                                    </p>

                                                    {feature.id === '03' && (
                                                        <div className="mt-8">
                                                            <Button
                                                                onClick={() => router.push('/chat')}
                                                                variant="primary"
                                                                size="md"
                                                                className="px-8 !bg-slate-900 hover:!bg-slate-800 dark:!bg-[#4A9EFF] dark:!text-white dark:hover:!bg-[#3B86E0]"
                                                            >
                                                                Get recommendations
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Academic Plan Board Section */}
                        <AcademicPlanBoard studentData={studentData} />

                        {/* Chatbot Action Section - Minimalist Style with extreme alignment */}
                        <div className="mt-20 mb-12 flex flex-col items-start gap-8 py-10 border-t border-slate-100 w-full">
                            <div className="text-left">
                                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                    Tracks Map
                                </h3>
                                <p className="text-slate-500 text-base mt-2 max-w-xl">
                                    Found your best tracks based on your interests and career goals
                                </p>
                            </div>

                            {/* Specialization Track Selection Cards */}
                            <div className="w-full">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        {
                                            id: 'general',
                                            title: 'General Track',
                                            desc: 'Comprehensive CS foundations including algorithms, networks, and theory.',
                                            // icon: '🎓',
                                            color: 'from-blue-500 to-blue-600',
                                            shadow: 'shadow-blue-200'
                                        },
                                        {
                                            id: 'media',
                                            title: 'Media Informatics',
                                            desc: 'Focus on 3D graphics, computer vision, and interactive multimedia systems.',
                                            // icon: '🎨',
                                            color: 'from-pink-500 to-pink-600',
                                            shadow: 'shadow-pink-200'
                                        },
                                        {
                                            id: 'bigdata',
                                            title: 'Big Data ',
                                            desc: 'Specialize in data mining, parallel computing, and intelligent systems.',
                                            // icon: '⚡',
                                            color: 'from-amber-500 to-amber-600',
                                            // shadow: 'shadow-amber-200'
                                        }
                                    ].map((track) => (
                                        <div
                                            key={track.id}
                                            onClick={() => setSelectedTrackId(track.id)}
                                            className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
                                        >
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${track.color} opacity-5 rounded-bl-[5rem] group-hover:scale-110 transition-transform`} />

                                            <div className="flex flex-col h-full relative z-10">
                                                <div className="flex items-center justify-between mb-6">

                                                    <div className="bg-slate-50 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full text-slate-500 border border-slate-100">
                                                        Open Matrix
                                                    </div>
                                                </div>

                                                <h5 className="text-2xl font-black text-slate-900 mb-3">{track.title}</h5>
                                                <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1">
                                                    {track.desc}
                                                </p>

                                                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm group-hover:gap-3 transition-all">
                                                    Explore Full Roadmap
                                                    <ArrowRight size={18} className="text-blue-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden pb-10 bg-slate-50 min-h-screen">
                {/* Mobile Header */}
                <div className="bg-white px-6 pt-6 pb-6 rounded-b-3xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Hi, {studentData.account.name.split(' ')[0]}</h1>
                                <p className="text-slate-500 font-medium text-sm mt-0.5">Ready to learn?</p>
                            </div>
                            <div onClick={() => router.push('/chat')} className="bg-blue-50 p-2.5 rounded-full text-blue-600 active:scale-95 transition-transform cursor-pointer">
                                <MessageSquare size={20} />
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">GPA</p>
                                <p className="text-xl font-black text-slate-900">{stats?.cumulativeGPA.toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Credits</p>
                                <p className="text-xl font-black text-slate-900">{stats?.totalCredits}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Courses</p>
                                <p className="text-xl font-black text-slate-900">{stats?.totalCourses}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Semesters</p>
                                <p className="text-xl font-black text-slate-900">{stats?.numSemesters}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Content */}
                <div className="px-5 mt-6 space-y-6">

                    {/* Academic Map Preview */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-900 text-lg">Academic Map</h3>
                            <button onClick={() => {
                                const el = document.querySelector(`[data-section-id="01"]`);
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">Explore</button>
                        </div>
                        <div className="h-[380px] w-full bg-slate-50 rounded-2xl relative overflow-hidden border-2 border-slate-200">
                            <AcademicMindMap
                                data={studentData}
                                selectedTrackId={selectedTrackId}
                                onBackToPersonal={() => setSelectedTrackId(null)}
                            />
                        </div>
                    </div>

                    {/* GPA Graph */}
                    <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-900 text-lg mb-4">GPA Progress</h3>
                        <div className="h-80 rounded-2xl bg-[#064E3B] overflow-hidden p-3 relative">
                            <GPAProgressChart data={studentData} />
                        </div>
                    </div>

                    {/* Academic Plan Board */}
                    <div className="mt-12 -mx-5 md:mx-0 md:bg-white md:rounded-3xl md:p-5 md:shadow-sm md:border md:border-slate-100">
                        <h3 className="font-bold text-slate-900 text-lg px-5 md:px-0">Academic Plan</h3>
                        <p className="text-slate-500 text-sm mb-6 px-5 md:px-0">Visualize and plan your path to graduation</p>
                        <AcademicPlanBoard
                            studentData={studentData}
                            className="mt-0 [&>div:nth-child(3)]:!shadow-none [&>div:nth-child(3)]:!border-none [&>div:nth-child(3)]:!p-0 [&>div:nth-child(3)]:!bg-transparent"
                        />
                    </div>

                    {/* Tracks */}
                    <div className="mt-12">
                        <h3 className="font-bold text-slate-900 text-lg mb-4 px-1">Specialization Tracks</h3>
                        <div className="space-y-3">
                            {[
                                {
                                    id: 'general',
                                    title: 'General Track',
                                    desc: 'CS foundations',
                                    color: 'from-blue-500 to-blue-600',
                                    border: 'border-blue-100',
                                    text: 'text-blue-600'
                                },
                                {
                                    id: 'media',
                                    title: 'Media Informatics',
                                    desc: 'Graphics & Vision',
                                    color: 'from-pink-500 to-pink-600',
                                    border: 'border-pink-100',
                                    text: 'text-pink-600'
                                },
                                {
                                    id: 'bigdata',
                                    title: 'Big Data',
                                    desc: 'Data Mining & AI',
                                    color: 'from-amber-500 to-amber-600',
                                    border: 'border-amber-100',
                                    text: 'text-amber-600'
                                }
                            ].map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => {
                                        setSelectedTrackId(track.id);
                                        const el = document.querySelector(`[data-section-id="01"]`);
                                        if (el) {
                                            el.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }}
                                    className="bg-white p-4 rounded-[1.5rem] border border-slate-100 relative overflow-hidden active:scale-98 transition-transform shadow-sm flex items-center gap-4"
                                >
                                    {/* Decorative Curve on Left */}
                                    <div className={`absolute top-0 left-0 w-14 h-14 bg-gradient-to-br ${track.color} opacity-10 rounded-br-[3rem] pointer-events-none`} />

                                    <div className="relative z-10 flex-1 ml-8">
                                        <h4 className="font-bold text-slate-900 text-base">{track.title}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">{track.desc}</p>
                                    </div>

                                    <div className={`relative z-10 w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center ${track.text}`}>
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

        </div >
    );
}
