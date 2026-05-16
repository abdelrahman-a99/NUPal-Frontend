import { CareerPath } from '@/data/careerData';
import { DynamicSkillsProfile } from '@/services/dynamicSkillsService';
import { CheckCircle2, TrendingUp, BookOpen, Brain, DollarSign, Briefcase, Map } from 'lucide-react';
import Button from '../ui/Button';

interface CareerPathwaysDisplayProps {
    career: CareerPath;
    studentProfile: DynamicSkillsProfile | null;
    onViewJobs?: () => void;
}

export function CareerPathwaysDisplay({ career, studentProfile, onViewJobs }: CareerPathwaysDisplayProps) {
    // Helper to find student's skill level
    const getStudentSkillLevel = (skillName: string) => {
        if (!studentProfile?.skills) return 0;

        // Try exact match
        const exactMatch = studentProfile.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
        if (exactMatch) return exactMatch.level;

        // Try partial match
        const partialMatch = studentProfile.skills.find(s =>
            s.name.toLowerCase().includes(skillName.toLowerCase()) ||
            skillName.toLowerCase().includes(s.name.toLowerCase())
        );
        return partialMatch ? partialMatch.level : 0;
    };

    // Calculate overall readiness
    const calculateReadiness = () => {
        if (!studentProfile) return 0;

        let totalWeight = 0;
        let weightedScore = 0;

        career.requiredSkills.forEach(skill => {
            const weight = skill.importance === 'Critical' ? 3 : skill.importance === 'Important' ? 2 : 1;
            const studentLevel = getStudentSkillLevel(skill.name);

            totalWeight += weight * 100;
            weightedScore += weight * studentLevel;
        });

        return Math.round((weightedScore / totalWeight) * 100);
    };

    const readinessScore = calculateReadiness();

    return (
        <div className="w-full rounded-[1.5rem] bg-white/20 dark:bg-slate-900/20 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[50px] p-4 gap-4 ring-1 ring-black/5">
            {/* Left Side: Career Context (White Background) */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg flex flex-col">
                <div>
                    {/* Header Logo/Icon Area */}
                    <div className="mb-6">
                        <div className="inline-flex items-center justify-center p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl mb-4">
                            {/* Logo Style Text */}
                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{career.title}</h3>
                        </div>

                        {/* "Quote" style description */}
                        <div className="relative">
                            <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-200 font-medium line-clamp-4">
                                "{career.description}"
                            </p>
                            <div className="mt-4 flex flex-col gap-1">
                                <span className="font-semibold text-slate-900 dark:text-slate-100">Career Reality</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 mt-2">
                        {career.roleReality.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                                <span className="text-base text-slate-600 dark:text-slate-300 line-clamp-2">{item}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3">
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={onViewJobs}
                            className="flex items-center gap-2"
                        >
                            <Briefcase className="h-4 w-4" />
                            <span>View Jobs</span>
                        </Button>

                        {career.roadmapUrl && (
                            <Button
                                variant="outline"
                                size="sm"
                                href={career.roadmapUrl}
                                className="flex items-center gap-2 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 hover:bg-blue-50"
                            >
                                <Map className="h-4 w-4" />
                                <span>Roadmap</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Side: Skills Analysis */}
            <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-lg flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Skills Analysis</h3>
                        <p className="text-slate-600 dark:text-slate-300 text-sm">Your readiness for this role</p>
                    </div>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800/60">
                        <span className={`text-xl font-bold ${readinessScore >= 80 ? 'text-green-600' :
                            readinessScore >= 50 ? 'text-yellow-600' : 'text-red-600 dark:text-red-300'
                            }`}>
                            {readinessScore}%
                        </span>
                    </div>
                </div>

                {/* Skills Visualization - Filling the space */}
                <div className="space-y-5">
                    {career.requiredSkills.map((skill, idx) => {
                        const studentLevel = getStudentSkillLevel(skill.name);
                        const gap = Math.max(0, skill.level - studentLevel);
                        const isMet = studentLevel >= skill.level;

                        return (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-xs mb-2">
                                    <span className="font-medium text-slate-700 dark:text-slate-200">{skill.name}</span>
                                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Target: {skill.level}%</span>
                                </div>
                                <div className="relative h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    {/* Background Requirement Marker */}
                                    <div
                                        className="absolute top-0 bottom-0 bg-slate-200 dark:bg-slate-700 border-r border-slate-300 dark:border-slate-600"
                                        style={{ width: `${skill.level}%`, left: 0 }}
                                    ></div>

                                    {/* Student Progress */}
                                    <div
                                        className={`absolute top-0 bottom-0 transition-all duration-1000 ease-out rounded-full ${isMet ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                                            }`}
                                        style={{ width: `${studentLevel}%` }}
                                    ></div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Action
                <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <BookOpen className="h-4 w-4" />
                        <span className="truncate">Rec: {career.learningPath[0]}</span>
                    </div>
                </div> */}
            </div>
        </div>
    );
}
