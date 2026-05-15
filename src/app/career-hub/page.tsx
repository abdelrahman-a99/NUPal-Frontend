'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getToken } from '@/lib/auth';
import { Job, fetchJobs } from '@/services/jobService';
import { DynamicSkillsProfile, fetchDynamicSkillsProfile } from '@/services/dynamicSkillsService';
import { JobCard } from '@/components/career-hub/JobCard';
import { FilterSidebar, FilterState } from '@/components/career-hub/FilterSidebar';
import { Pagination } from '@/components/career-hub/Pagination';
import { Search, MapPin, SlidersHorizontal, X, FileText, Sparkles, ArrowRight } from 'lucide-react';
// import { BackgroundAnimation } from '@/components/career-hub/BackgroundAnimation';
import { careerPaths } from '@/data/careerData';
import { CareerCategoryBox } from '@/components/career-hub/CareerCategoryBox';
import { CareerPathwaysDisplay } from '@/components/career-hub/CareerPathwaysDisplay';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { Dispatch, SetStateAction } from 'react';
import ResumeAnalyzerPage from './resume-analyzer/page';

function CareerHubPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab');

    // Show Job Search only if tab is explicitly 'find-jobs'
    const isFindJobsActive = activeTab === 'find-jobs';

    // Default to Resume Analyzer for anything else (including empty tab)
    const isResumeAnalyzerTab = !isFindJobsActive;

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentProfile, setStudentProfile] = useState<DynamicSkillsProfile | null>(null);

    // Career Path State
    const [selectedCareerId, setSelectedCareerId] = useState(careerPaths[0].id);
    const selectedCareer = careerPaths.find(c => c.id === selectedCareerId) || careerPaths[0];

    // Search parameters
    const [jobType, setJobType] = useState('');
    const [location, setLocation] = useState('Cairo');

    // Filter state
    const [filters, setFilters] = useState<FilterState>({
        employmentTypes: [],
        workTypes: [],
        categories: [],
        companies: [],
    });
    const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

    // Derived state for top companies
    const [topCompanies, setTopCompanies] = useState<string[]>([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5;

    // Mobile filter state
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempFilters, setTempFilters] = useState<FilterState>(filters);

    // Sync tempFilters when opening
    useEffect(() => {
        if (isFilterOpen) {
            setTempFilters(filters);
        }
    }, [isFilterOpen, filters]);

    const loadJobs = async (what?: string, where?: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchJobs({
                what: what || undefined,
                where: where || undefined
            });

            if (data.length === 0) {
                setError('No jobs found for your search criteria. Try different keywords or locations.');
            }
            setJobs(data);

            // Calculate top companies from fetched data
            const companyCounts: { [key: string]: number } = {};
            data.forEach(job => {
                if (job.companyName) {
                    companyCounts[job.companyName] = (companyCounts[job.companyName] || 0) + 1;
                }
            });
            // Get top 5 companies by job count
            const sortedCompanies = Object.entries(companyCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([name]) => name);
            setTopCompanies(sortedCompanies);

        } catch (err: any) {
            const errorMessage = err?.message || '';
            if (errorMessage.includes('500') || errorMessage.includes('Failed to fetch')) {
                setError('Unable to fetch jobs from Wuzzuf. Please try again later.');
            } else {
                setError('Failed to load jobs. Please check your internet connection and try again.');
            }
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
        loadStudentProfile();
    }, []);

    const loadStudentProfile = async () => {
        const profile = await fetchDynamicSkillsProfile();

        if (profile) {
            setStudentProfile(profile);
        } else {
            // Fallback demo skills for when not logged in
            setStudentProfile({
                name: 'Student',
                skills: [
                    { name: 'Python', level: 85, category: 'Programming' },
                    { name: 'Data Structures', level: 90, category: 'Computer Science' },
                    { name: 'Machine Learning', level: 70, category: 'AI/ML' },
                    { name: 'Web Development', level: 75, category: 'Development' }
                ]
            });
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        loadJobs(jobType || undefined, location || undefined);
    };

    // Client-side filtering
    useEffect(() => {
        let filtered = jobs;

        if (location) {
            filtered = filtered.filter(job =>
                job.location.toLowerCase() === location.toLowerCase()
            );
        }

        if (filters.employmentTypes.length > 0) {
            filtered = filtered.filter(job => {
                if (!job.contractTime) return false;
                const normalizedJobType = job.contractTime.toLowerCase().replace(/[^a-z0-9]/g, '');
                return filters.employmentTypes.some(type => {
                    const normalizedFilterType = type.toLowerCase().replace(/[^a-z0-9]/g, '');
                    return normalizedJobType.includes(normalizedFilterType);
                });
            });
        }

        if (filters.workTypes.length > 0) {
            filtered = filtered.filter(job =>
                job.workType && filters.workTypes.includes(job.workType.toLowerCase())
            );
        }

        if (filters.companies.length > 0) {
            filtered = filtered.filter(job =>
                job.companyName && filters.companies.includes(job.companyName)
            );
        }

        if (filters.categories.length > 0) {
            filtered = filtered.filter(job =>
                filters.categories.some(category =>
                    job.title.toLowerCase().includes(category.toLowerCase()) ||
                    job.description.toLowerCase().includes(category.toLowerCase()) ||
                    job.category.toLowerCase().includes(category.toLowerCase())
                )
            );
        }

        setFilteredJobs(filtered);
        setCurrentPage(1);
    }, [jobs, filters, location]);

    const handleFilterChange = (newFilters: SetStateAction<FilterState>) => {
        setFilters(newFilters);
    };

    // Calculate pagination
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const currentJobs = filteredJobs.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const jobsSection = document.getElementById('jobs-section');
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleViewJobs = () => {
        setJobType(selectedCareer.title);
        loadJobs(selectedCareer.title, location);
        const jobsSection = document.getElementById('jobs-section');
        if (jobsSection) {
            jobsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (isResumeAnalyzerTab) {
        return <ResumeAnalyzerPage />;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Section: Career Pathways & Skills Gap Analysis
            <div className="relative overflow-hidden pb-16 pt-8 bg-slate-50">
                <div className="hidden md:block">
                    <BackgroundAnimation />
                </div>

                <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="md:hidden text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold uppercase tracking-wide mb-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Career Compass
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Real student results
                        </h1>
                        <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                            Explore how your current skills align with market demands and discover your personalized path to success.
                        </p>
                    </div>

                    <div className="hidden md:block text-left mb-8">
                        <h1 className="text-2xl font-bold text-slate-700 sm:text-2xl">
                            Real student results
                        </h1>
                        <div className="mt-2 h-1.5 w-16 bg-blue-500 rounded-full"></div>
                    </div>

                    <CareerPathwaysDisplay
                        career={selectedCareer}
                        studentProfile={studentProfile}
                        onViewJobs={handleViewJobs}
                    />

                    <div className="mt-8 mx-auto w-full max-w-full">
                        <div className="grid grid-cols-2 gap-2 md:flex md:gap-0 md:bg-white md:rounded-xl md:shadow-sm md:w-fit md:mx-auto md:overflow-hidden md:divide-x md:divide-slate-200">
                            {careerPaths.map((career) => (
                                <div key={career.id} className="md:min-w-0">
                                    <div className="h-full md:h-auto bg-white rounded-xl md:rounded-none border border-slate-200 md:border-0 shadow-sm md:shadow-none overflow-hidden transition-shadow md:transition-none hover:shadow-md md:hover:shadow-none">
                                        <CareerCategoryBox
                                            id={career.id}
                                            title={career.title}
                                            iconName={career.icon}
                                            isSelected={selectedCareerId === career.id}
                                            onClick={() => setSelectedCareerId(career.id)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            */}

            {/* Bottom Section: Header and Search */}
            <div className="relative pb-16 pt-6 bg-slate-50">
                <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8 z-10">
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        Find your{' '}
                        <span className="relative inline-block text-blue-500">
                            dream jobs
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-blue-400 opacity-80" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                    </h2>
                    <p className="mt-2 text-lg text-slate-600">
                        Find real opportunities at top companies
                    </p>

                    <form onSubmit={handleSearch} className="mt-10 w-full max-w-full px-1">
                        <div className="mx-auto flex flex-col md:flex-row max-w-3xl items-center gap-3 rounded-lg bg-white p-2 shadow-lg w-full overflow-hidden">
                            <div className="relative w-full md:flex-1 min-w-0">
                                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Job title or keyword"
                                    value={jobType}
                                    onChange={(e) => setJobType(e.target.value)}
                                    className="w-full rounded-md border-0 bg-transparent py-3 pl-12 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none"
                                />
                            </div>
                            <div className="hidden md:block h-8 w-px bg-slate-200"></div>
                            <div className="relative w-full md:flex-1 min-w-0">
                                <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full appearance-none rounded-md border-0 bg-transparent py-3 pl-12 pr-10 text-slate-900 focus:outline-none truncate relative z-10"
                                >
                                    <option value="">All Locations</option>
                                    <option value="Cairo">Cairo</option>
                                    <option value="Alexandria">Alexandria</option>
                                    <option value="Giza">Giza</option>
                                </select>
                                <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            <Button type="submit" variant="primary" size="md" disabled={loading} className="w-full md:w-auto px-8 shadow-md">
                                Search
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Job Results Section with Sidebar */}
            <div id="jobs-section" className="bg-slate-50 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-8">
                        <div className="hidden md:block w-64 flex-shrink-0">
                            <FilterSidebar onFilterChange={handleFilterChange} topCompanies={topCompanies} selectedFilters={filters} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-bold text-slate-900">All Jobs</h2>
                                    <p className="mt-0.5 text-[10px] md:text-sm text-slate-600">Showing {filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}</p>
                                </div>
                                <Button onClick={() => setIsFilterOpen(true)} variant="none" className="md:hidden flex items-center gap-1.5 px-4 py-2 bg-blue-50/80 text-blue-600 rounded-full font-semibold text-xs shadow-sm hover:bg-blue-100 transition-all border border-blue-100/50">
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    <span>Filters</span>
                                </Button>
                            </div>

                            {isFilterOpen && (
                                <div className="fixed inset-0 z-[100] md:hidden">
                                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-[2.5rem] shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-500 max-h-[50vh]">
                                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />
                                        <div className="flex items-center justify-between px-8 py-3 border-b border-slate-50">
                                            <h3 className="text-xl font-bold text-slate-900">Filters</h3>
                                            <Button variant="none" size="none" onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                <X className="h-6 w-6 text-slate-500" />
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-8 py-4">
                                            <FilterSidebar onFilterChange={setTempFilters} topCompanies={topCompanies} selectedFilters={tempFilters} />
                                        </div>
                                        <div className="p-4 pb-8 px-8 border-t border-slate-50 bg-white">
                                            <Button className="w-full py-3.5 text-base font-bold shadow-lg shadow-blue-100 rounded-2xl" onClick={() => { setFilters(tempFilters); setIsFilterOpen(false); }}>
                                                Show Results
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                                    <p className="text-sm font-medium">{error}</p>
                                </div>
                            )}

                            {loading && (
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
                                            <div className="flex gap-4">
                                                <Skeleton className="h-12 w-12 rounded-xl" />
                                                <div className="flex-1 space-y-2">
                                                    <Skeleton className="h-6 w-1/3" />
                                                    <Skeleton className="h-4 w-1/4" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-20 w-full" />
                                            <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-20 rounded-full" /></div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!loading && currentJobs.length > 0 && (
                                <>
                                    <div className="space-y-4">
                                        {currentJobs.map((job) => <JobCard key={job.id} job={job} />)}
                                    </div>
                                    {totalPages > 1 && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
                                </>
                            )}

                            {!loading && filteredJobs.length === 0 && !error && (
                                <div className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-12 text-center">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Search className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-semibold text-slate-900">No jobs found</h3>
                                    <p className="mt-2 text-sm text-slate-600">Try adjusting your search criteria or filters.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CareerHubPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 py-12">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="animate-pulse space-y-8">
                        <div className="h-10 w-64 bg-slate-200 rounded-lg mb-8" />
                        <div className="h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm" />
                        <div className="flex gap-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 flex-1 bg-white rounded-xl border border-slate-100 shadow-sm" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        }>
            <CareerHubPageInner />
        </Suspense>
    );
}
