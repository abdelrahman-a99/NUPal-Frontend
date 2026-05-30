import React, { useState, useMemo } from 'react';
import { StudentResponse } from '../../services/studentService';
import { Course, RoadmapCategory, CourseStatus } from '../../types/roadmap';
import RoadmapColumn from './RoadmapColumn';
import { Search, Filter, LayoutGrid, List, Flag, Trophy, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

interface AcademicPlanBoardProps {
    studentData: StudentResponse;
    className?: string;
}

type ViewMode = 'category' | 'semester';

// Master list for General Education based on user's requirements
const GEN_ED_MASTER_LIST = {
    'English (12 Credits)': [
        { id: 'ENGL001', name: 'Intensive English', credits: 3 },
        { id: 'ENGL101', name: 'English I', credits: 3 },
        { id: 'ENGL102', name: 'English II', credits: 3 },
        { id: 'ENGL201', name: 'Writing Skills', credits: 3 },
        { id: 'ENGL202', name: 'Communication & Presentation Skills', credits: 3 },
    ],
    'Humanities (6+ Credits)': [
        { id: 'HUMA101', name: 'Intro to Logic', credits: 2 },
        { id: 'HUMA102', name: 'Intro to Ethics', credits: 1 },
        { id: 'ARTS105', name: 'Music Appreciation', credits: 3 },
        { id: 'ARTS118', name: 'RoboArt Competition', credits: 3 },
        { id: 'ARTS201', name: 'Intro to Photography', credits: 3 },
        { id: 'ARTS205', name: 'Music Theory', credits: 3 },
        { id: 'CHIN101', name: 'Intro to Chinese', credits: 3 },
        { id: 'DEUT101', name: 'Intro to German', credits: 3 },
        { id: 'SPAN101', name: 'Intro to Spanish', credits: 3 },
    ],
    'Social Sciences (9+ Credits)': [
        { id: 'SSCI101', name: 'Egyptian & Arab Heritage', credits: 3 },
        { id: 'SSCI301', name: 'Project Management', credits: 3 },
        { id: 'ECON201', name: 'Macroeconomics', credits: 3 },
        { id: 'PSCI201', name: 'Intro to Political Science', credits: 3 },
        { id: 'PSYC201', name: 'Intro to Psychology', credits: 3 },
        { id: 'PSYC203', name: 'Theories of Personalities', credits: 3 },
        { id: 'SSCI102', name: 'World Cultures & Diversity', credits: 3 },
        { id: 'SSCI103', name: 'Selected Topics in Social Sciences', credits: 3 },
    ],
    'Natural Sciences (3 Credits)': [
        { id: 'NSCI102', name: 'Environmental Science', credits: 3 },
    ]
};

const MATH_SCIENCE_MASTER_LIST = {
    'Mathematics': [
        { id: 'MATH111', name: 'Calculus I', credits: 4 },
        { id: 'MATH112', name: 'Calculus II', credits: 4 },
        { id: 'MATH211', name: 'Discrete Mathematics', credits: 3 },
        { id: 'MATH201', name: 'Probability & Statistics', credits: 3 },
        { id: 'MATH210', name: 'Calculus III', credits: 3 },
        { id: 'MATH203', name: 'Differential Equations', credits: 4 },
        { id: 'MATH301', name: 'Linear Algebra', credits: 4 },
    ],
    'Physics': [
        { id: 'PHYS101C', name: 'Physics I', credits: 4 },
    ],
    'Elec-Comp Core': [
        { id: 'ECEN101C', name: 'Electric Circuits', credits: 3 },
    ]
};

const CSCI_CORE_MASTER_LIST = {
    'Comp Science core': [
        { id: 'CSCI101', name: 'Computer & Information Skills', credits: 3 },
        { id: 'CSCI102', name: 'Introduction to Programming', credits: 3 },
        { id: 'CSCI205', name: 'Introduction to Computer Systems', credits: 3 },
        { id: 'CSCI207', name: 'Data Structures and Algorithms', credits: 3 },
        { id: 'CSCI217', name: 'Advanced Programming', credits: 3 },
        { id: 'CSCI208', name: 'Design and Analysis of Algorithms', credits: 3 },
        { id: 'CSCI221', name: 'Logic Design', credits: 4 },
        { id: 'CSCI313', name: 'Software Engineering', credits: 3 },
        { id: 'CSCI311', name: 'Computer Architecture', credits: 3 },
        { id: 'CSCI322', name: 'Data Analysis', credits: 3 },
        { id: 'CSCI305', name: 'Database Systems', credits: 3 },
        { id: 'CSCI315', name: 'Operating Systems', credits: 3 },
        { id: 'CSCI417', name: 'Machine Intelligence', credits: 3 },
        { id: 'CSCI419', name: 'Theory of Computing', credits: 3 },
        { id: 'CSCI415', name: 'Compiler Design', credits: 3 },
        { id: 'CSCI463', name: 'Computer Networks', credits: 3 },
        { id: 'CSCI495', name: 'Senior Project I', credits: 2 },
        { id: 'CSCI496', name: 'Senior Project II', credits: 2 },
        { id: 'COMM401', name: 'Internship & Service Learning', credits: 3 },
        { id: 'CSCI490', name: 'Industrial/Research Training', credits: 2 },
    ]
};

const CSCI_ELECTIVES_MASTER_LIST = {
    'CSelectives': [
        { id: 'CSCI451', name: 'Digital Image Processing', credits: 3 },
        { id: 'CSCI452', name: '3D Computer Graphics and Visualization', credits: 3 },
        { id: 'CSCI455', name: 'Computer Vision Systems', credits: 3 },
        { id: 'CSCI456', name: 'Interactive Multimedia Systems', credits: 3 },
        { id: 'CSCI457', name: 'Mixed and Augmented Reality', credits: 3 },
        { id: 'CSCI458', name: 'Serious Computer Games', credits: 3 },
        { id: 'AIS411', name: 'Natural Language Processing', credits: 3 },
        { id: 'CSCI461', name: 'Introduction to Big Data', credits: 3 },
        { id: 'CSCI479', name: 'Selected Topics in Computer Science', credits: 3 },
        { id: 'CSCI462', name: 'Computational Intelligence', credits: 3 },
        { id: 'CSCI464', name: 'Numerical Methods & Math Precision', credits: 3 },
        { id: 'CSCI465', name: 'Introduction to Parallel Computing', credits: 3 },
        { id: 'CSCI467', name: 'Data Mining and Analytics', credits: 3 },
        { id: 'CSCI471', name: 'Introduction to BioInformatics', credits: 3 },
        { id: 'CSCI472', name: 'Signal Processing', credits: 3 },
        { id: 'CSCI475', name: 'Embedded Real-Time Systems', credits: 3 },
    ]
};

const AcademicPlanBoard: React.FC<AcademicPlanBoardProps> = ({ studentData, className }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('category');
    const [searchQuery, setSearchQuery] = useState('');

    const allCourses = useMemo(() => {
        const courses: Course[] = [];
        studentData.education.semesters.forEach((semester, semIdx) => {
            semester.courses.forEach((course) => {
                let status: CourseStatus = 'Not Taken';
                if (course.grade === 'F') {
                    status = 'Failed';
                } else if (course.grade) {
                    status = 'Completed';
                } else if (semIdx === studentData.education.semesters.length - 1) {
                    status = 'In Progress';
                }

                // Refined Categorization
                let category = 'Others';

                if (course.courseId === 'COMM401' || (course.courseId.startsWith('CSCI') && !Object.values(CSCI_ELECTIVES_MASTER_LIST).some(list => list.some(m => m.id === course.courseId || (m.id + 'C') === course.courseId || m.id === (course.courseId + 'C'))))) {
                    category = 'ITCS Core';
                }
                else if (Object.values(CSCI_ELECTIVES_MASTER_LIST).some(list => list.some(m => m.id === course.courseId || (m.id + 'C') === course.courseId || m.id === (course.courseId + 'C')))) {
                    category = 'ITCS Electives';
                }
                else if (course.courseId.startsWith('MATH') || course.courseId.startsWith('PHYS') || course.courseId.startsWith('ECEN')) {
                    category = 'Math & Science';
                }
                else if (course.courseId.startsWith('ENGL')) {
                    category = 'Gen Ed: English';
                }
                else if (course.courseId.startsWith('HUMA') || course.courseId.startsWith('ARTS') || course.courseId.startsWith('CHIN') || course.courseId.startsWith('DEUT') || course.courseId.startsWith('SPAN') || course.courseId.startsWith('HIST')) {
                    category = 'Gen Ed: Humanities';
                }
                else if (course.courseId.startsWith('SSCI') || course.courseId.startsWith('PSYC') || course.courseId.startsWith('ECON') || course.courseId.startsWith('PSCI')) {
                    category = 'Gen Ed: Social Sciences';
                }
                else if (course.courseId.startsWith('NSCI')) {
                    category = 'Gen Ed: Natural';
                }
                else if (course.courseId.includes('UNIV')) {
                    category = 'General Education';
                }

                courses.push({
                    id: course.courseId,
                    name: course.courseName,
                    credits: course.credit,
                    status: status as any,
                    category: category,
                    semester: semIdx + 1,
                    grade: course.grade,
                    gpa: course.gpa
                });
            });
        });
        return courses;
    }, [studentData]);

    const filteredCourses = useMemo(() => {
        return allCourses.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allCourses, searchQuery]);

    const columns = useMemo(() => {
        interface RoadmapColumnData {
            name: string;
            courses: Course[];
            groups?: { title: string; courses: Course[] }[];
            stats?: {
                completed: number;
                min: number;
            };
        }

        if (viewMode === 'category') {
            // Internal helper to get course state from student data (flexible ID matching)
            const getCourseState = (masterId: string) => {
                const normalize = (id: string) => id.replace(/[^a-z0-9]/gi, '').toLowerCase();
                const masterNorm = normalize(masterId);
                const masterNormC = normalize(masterId + 'C');

                // We use allCourses instead of filteredCourses to ensure that 
                // even if a course is filtered out from the UI (due to search),
                // it is still correctly identified for credit calculation and state lookup.
                const taken = allCourses.find(c => {
                    const dbId = c.id;
                    const rawParts = dbId.split('/');
                    const firstPartPrefix = rawParts[0].match(/^[A-Z]+/)?.[0] || '';

                    const fullParts = rawParts.map((part, idx) => {
                        const norm = normalize(part.trim());
                        // If it's a numeric part (e.g., "101" in "HUMA001/101"), re-attach prefix from first part
                        if (idx > 0 && /^\d+$/.test(norm) && firstPartPrefix) {
                            return normalize(firstPartPrefix + norm);
                        }
                        return norm;
                    });

                    return fullParts.some(part =>
                        part === masterNorm ||
                        part === masterNormC ||
                        normalize(part + 'C') === masterNorm ||
                        (part.includes(masterNorm) && part.length <= masterNorm.length + 2) ||
                        (masterNorm.includes(part) && masterNorm.length <= part.length + 2)
                    ) ||
                        // Equivalency Mapping: Database ID CSCI112 counts as Master ID CSCI479
                        (masterId === 'CSCI479' && fullParts.includes('csci112'));
                });

                // If found, ensure we return it with the Master List's identity (ID and Name)
                // so the UI remains consistent even if the DB has a slightly different ID/Name.
                if (taken) {
                    const masterCourse = Object.values({
                        ...GEN_ED_MASTER_LIST,
                        ...MATH_SCIENCE_MASTER_LIST,
                        ...CSCI_CORE_MASTER_LIST,
                        ...CSCI_ELECTIVES_MASTER_LIST
                    }).flatMap(list => list).find(m => m.id === masterId);

                    return {
                        ...taken,
                        id: masterId,
                        name: masterCourse?.name || taken.name
                    };
                }
                return taken;
            };

            const result: RoadmapColumnData[] = [];

            const calculateStats = (groups: { title: string; courses: Course[] }[], min: number) => {
                const allCourses = groups.flatMap(g => g.courses);
                const uniqueIds = new Set<string>();
                const completed = allCourses
                    .filter(c => {
                        if (c.status !== 'Completed') return false;
                        if (uniqueIds.has(c.id)) return false;
                        uniqueIds.add(c.id);
                        return true;
                    })
                    .reduce((sum, c) => sum + (c.credits || 0), 0);
                return { completed, min };
            };

            // 1. ITCS Core (Grouped)
            const itcsCoreGroups = Object.entries(CSCI_CORE_MASTER_LIST).map(([sectionTitle, masterCourses]) => {
                const sectionCourses: Course[] = masterCourses.flatMap(mc => {
                    const taken = getCourseState(mc.id);

                    if (searchQuery) {
                        const matches = mc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mc.id.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matches) return [];
                    }

                    if (taken) return [taken];

                    return [{
                        id: mc.id,
                        name: mc.name,
                        credits: mc.credits,
                        status: 'Not Taken' as const,
                        category: 'ITCS Core'
                    }];
                });
                return { title: sectionTitle, courses: sectionCourses };
            }).filter(g => g.courses.length > 0);


            // 2. Math & Science (Grouped)
            const mathSciGroups = Object.entries(MATH_SCIENCE_MASTER_LIST).map(([sectionTitle, masterCourses]) => {
                const sectionCourses: Course[] = masterCourses.flatMap(mc => {
                    const taken = getCourseState(mc.id);

                    if (searchQuery) {
                        const matches = mc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mc.id.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matches) return [];
                    }

                    if (taken) return [taken];

                    return [{
                        id: mc.id,
                        name: mc.name,
                        credits: mc.credits,
                        status: 'Not Taken' as const,
                        category: 'Math & Science'
                    }];
                });
                return { title: sectionTitle, courses: sectionCourses };
            }).filter(g => g.courses.length > 0);


            // 3. Consolidated General Education
            const genEdGroups = Object.entries(GEN_ED_MASTER_LIST).map(([sectionTitle, masterCourses]) => {
                const sectionCourses: Course[] = masterCourses.flatMap(mc => {
                    const taken = getCourseState(mc.id);

                    if (searchQuery) {
                        const matches = mc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mc.id.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matches) return [];
                    }

                    if (taken) return [taken];

                    // If not taken, create a "ghost" course card
                    return [{
                        id: mc.id,
                        name: mc.name,
                        credits: mc.credits,
                        status: 'Not Taken' as const,
                        category: 'General Education'
                    }];
                });
                return { title: sectionTitle, courses: sectionCourses };
            }).filter(g => g.courses.length > 0);

            result.push({
                name: 'General Education',
                courses: [], // Empty because we use 'groups' logic
                groups: genEdGroups,
                stats: calculateStats(genEdGroups, 33)
            });

            result.push({
                name: 'Math & Science',
                courses: [],
                groups: mathSciGroups,
                stats: calculateStats(mathSciGroups, 32)
            });

            result.push({
                name: 'ITCS Core',
                courses: [],
                groups: itcsCoreGroups,
                stats: calculateStats(itcsCoreGroups, 58)
            });

            // 4. ITCS Electives (Grouped)
            const itcsElectiveGroups = Object.entries(CSCI_ELECTIVES_MASTER_LIST).map(([sectionTitle, masterCourses]) => {
                const sectionCourses: Course[] = masterCourses.flatMap(mc => {
                    const taken = getCourseState(mc.id);

                    if (searchQuery) {
                        const matches = mc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            mc.id.toLowerCase().includes(searchQuery.toLowerCase());
                        if (!matches) return [];
                    }

                    if (taken) return [taken];

                    return [{
                        id: mc.id,
                        name: mc.name,
                        credits: mc.credits,
                        status: 'Not Taken' as const,
                        category: 'ITCS Electives'
                    }];
                });

                // Add Internship/Others if they exist but aren't in the master list OR used in other columns
                const otherElectives = filteredCourses.filter(c =>
                    c.category === 'ITCS Electives' &&
                    c.status === 'Completed' &&
                    !masterCourses.some(mc => mc.id === c.id || (mc.id + 'C') === c.id || mc.id === (c.id + 'C')) &&
                    // Check if already used in Gen Ed, Math/Sci, or Core
                    !result.some(col => col.courses.some(rc => rc.id === c.id) || (col.groups && col.groups.some(g => g.courses.some(gc => gc.id === c.id))))
                );

                return {
                    title: sectionTitle,
                    courses: [...sectionCourses, ...otherElectives]
                };
            }).filter(g => g.courses.length > 0);

            result.push({
                name: 'ITCSelectives',
                courses: [],
                groups: itcsElectiveGroups,
                stats: calculateStats(itcsElectiveGroups, 12)
            });

            return result;
        } else {
            const semesters: Record<number, Course[]> = {};
            filteredCourses.forEach(course => {
                if (!semesters[course.semester!]) {
                    semesters[course.semester!] = [];
                }
                semesters[course.semester!].push(course);
            });

            return Object.entries(semesters)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, courses]): RoadmapColumnData => ({ name: `Semester ${sem}`, courses }));
        }
    }, [filteredCourses, viewMode]);

    return (
        <div className={`w-full ${className || 'mt-24'}`}>
            {/* Visual Separator */}
            <div className="w-full h-px bg-slate-200 dark:bg-slate-700 mb-12"></div>

            {/* Header Section - Outside the Board Box */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 px-5 md:px-0">
                <div className="hidden md:block">
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Academic Plan</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Visualize and plan your path to graduation</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all w-full md:w-64 shadow-sm"
                        />
                    </div>

                    <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                        <Button
                            variant="none"
                            size="none"
                            onClick={() => setViewMode('category')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'category' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden md:inline">Category</span>
                        </Button>
                        <Button
                            variant="none"
                            size="none"
                            onClick={() => setViewMode('semester')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'semester' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden md:inline">Semester</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* The "Big Box" containing ONLY the columns */}
            <div className="md:bg-white md:dark:bg-slate-900 md:rounded-[2.5rem] md:border md:border-slate-200 md:dark:border-slate-700 md:shadow-xl md:overflow-hidden md:p-8 md:bg-slate-50/20 md:dark:bg-slate-900/20">
                <div className={`
                    flex gap-4 pb-6 scrollbar-thin scrollbar-thumb-slate-200 min-h-[500px] px-5 md:px-0
                    ${viewMode === 'category'
                        ? 'flex-nowrap justify-between overflow-x-auto lg:overflow-x-hidden'
                        : 'flex-nowrap overflow-x-auto'}
                `}>
                    {columns.map((column) => (
                        <div key={column.name} className={viewMode === 'category' ? 'flex flex-col gap-4 flex-1 min-w-[240px]' : 'flex-shrink-0 w-[300px]'}>
                            <div className="flex-1">
                                <RoadmapColumn
                                    title={column.name}
                                    courses={column.courses}
                                    groups={column.groups}
                                />
                            </div>

                            {/* Goals Box for Category View - Anchored to bottom */}
                            {viewMode === 'category' && column.stats && (
                                <div className="mt-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-lg ring-1 ring-slate-200/50">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Goals</span>
                                            <Trophy size={14} className="text-amber-400" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Flag size={14} className="text-emerald-500 fill-emerald-500" />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Completed:</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{column.stats.completed} hours</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Flag size={14} className="text-slate-300" />
                                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Remaining:</span>
                                                </div>
                                                <span className="text-sm font-black text-slate-900 dark:text-slate-100">{Math.max(0, column.stats.min - column.stats.completed)} hours</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AcademicPlanBoard;
