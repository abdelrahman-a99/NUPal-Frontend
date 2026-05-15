'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    ReactFlow,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    MarkerType,
    Edge,
    Background,
    Controls,
    Panel,
    Handle,
    Position,
    NodeProps,
    BaseEdge,
    getBezierPath,
    EdgeProps,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut, ChevronsUpDown, ChevronsDownUp, ChevronRight, X } from 'lucide-react';
import Button from '../ui/Button';

interface MindMapNodeData {
    label: string;
    level: number;
    collapsed: boolean;
    onToggle: (id: string) => void;
    entranceDelay?: number;
    index?: number;
    category?: string;
    isPersonal?: boolean;
}

// Custom Node Component - Dual Style (NotebookLM Pill for Personal, Big Node for Tracks)
const MindMapNode = ({ data, id }: { data: MindMapNodeData; id: string }) => {
    // Category-based colors from University Images (Used ONLY for Tracks)
    const getCategoryStyles = (category?: string) => {
        // Shared dark mode check (usually handled by CSS but needed for hardcoded logic)
        const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark-mode');

        switch (category) {
            case 'Math': return 'bg-[#FCE7F3] text-[#A01B4D] border-[#FBCFE8]'; 
            case 'Core': return 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]';
            case 'Systems': return 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
            case 'Track': return 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]';
            case 'Graphics': return 'bg-[#F3F4F6] text-[#374151] border-[#E5E7EB]';
            case 'Senior': return 'bg-[#FFEDD5] text-[#9A3412] border-[#FED7AA]';
            case 'English': return 'bg-[#CFFAFE] text-[#0891B2] border-[#A5F3FC]';
            case 'Huma': return 'bg-[#F0F9FF] text-[#0369A1] border-[#E0F2FE]';
            case 'SSCI': return 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]';
            default: return 'bg-white text-slate-800 border-slate-200';
        }
    };

    const isRoot = data.level === 0;
    const isSemester = data.level === 1;
    const isCollapsed = data.collapsed;
    const catStyles = getCategoryStyles(data.category);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (data.onToggle) data.onToggle(id);
    };

    // --- PERSONAL MAP STYLE (Original NotebookLM Pill Style) ---
    if (data.isPersonal) {
        return (
            <div className="group relative flex items-center">
                <Handle type="target" position={Position.Left} className="!w-0 !h-0 !opacity-0 !border-none !p-0" style={{ left: '2px', top: '50%' }} />

                <div className={`py-1.5 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border-2 transition-all duration-300 flex items-center justify-between hover:brightness-[0.95] 
                    ${data.level === 3 ? 'px-3 min-w-[100px] justify-center gap-1.5' : 'px-4 md:px-6 min-w-[160px] md:min-w-[200px] gap-3 md:gap-6'}
                    ${isRoot ? 'bg-[#4A9EFF] text-white border-blue-400 shadow-[0_0_20px_rgba(74,158,255,0.3)]' :
                        isSemester ? 'bg-[#D1D9FF] text-[#1E293B] border-[#BCC6FF]' :
                            data.level === 3 ? 'bg-white text-emerald-700 border-emerald-100 shadow-sm' :
                                'bg-[#E7F7F0] text-[#1E293B] border-[#D1EEDD]'}`}>

                    <span className={`tracking-tight whitespace-nowrap ${data.level === 3 ? 'text-[11px] md:text-[13px] font-bold' : 'text-[12px] md:text-[15px] font-extrabold'}`}>
                        {data.label}
                    </span>

                    {data.level < 3 && typeof data.onToggle === 'function' && (
                        <Button
                            variant="none"
                            size="none"
                            onClick={handleToggle}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm cursor-pointer z-50
                             ${isRoot ? 'bg-white/20 text-white hover:bg-white/30' :
                                    isSemester ? 'bg-white/80 text-indigo-700 hover:bg-white' :
                                        'bg-white/80 text-green-700 hover:bg-white'}`}>
                            <ChevronRight size={16} className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
                        </Button>
                    )}
                </div>

                <Handle type="source" position={Position.Right} className="!w-0 !h-0 !opacity-0 !border-none !p-0" style={{ right: '2px', top: '50%' }} />
            </div>
        );
    }

    // --- TRACK MAP STYLE (Professional Minimal Grid Style) ---
    return (
        <div className="group relative flex items-center transition-all duration-300">
            {/* 11 Left Handles (Target) */}
            <Handle type="target" position={Position.Left} id="left-0" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '10%' }} />
            <Handle type="target" position={Position.Left} id="left-1" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '18%' }} />
            <Handle type="target" position={Position.Left} id="left-2" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '26%' }} />
            <Handle type="target" position={Position.Left} id="left-3" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '34%' }} />
            <Handle type="target" position={Position.Left} id="left-4" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '42%' }} />
            <Handle type="target" position={Position.Left} id="left-5" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '50%' }} />
            <Handle type="target" position={Position.Left} id="left-6" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '58%' }} />
            <Handle type="target" position={Position.Left} id="left-7" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '66%' }} />
            <Handle type="target" position={Position.Left} id="left-8" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '74%' }} />
            <Handle type="target" position={Position.Left} id="left-9" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '82%' }} />
            <Handle type="target" position={Position.Left} id="left-10" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '90%' }} />

            <div className={`
                relative rounded-xl border-2 transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md py-5 px-6 text-center
                ${isRoot ? 'bg-[#4A9EFF] text-white border-blue-400 min-w-[280px] rounded-2xl shadow-xl' :
                    isSemester ? 'bg-slate-50 text-indigo-900 border-slate-200 min-w-[240px] rounded-xl dark:bg-slate-800 dark:text-indigo-200 dark:border-slate-700' :
                        `${catStyles} min-w-[240px] max-w-[280px] rounded-lg`}
            `}>
                <div className="flex flex-col items-center justify-center w-full overflow-hidden">
                    <span className={`tracking-tight leading-snug block w-full whitespace-pre-line ${isRoot ? 'text-lg font-black' : 'text-[14px] font-extrabold text-slate-800 dark:text-slate-200'}`}>
                        {data.label}
                    </span>
                </div>
            </div>

            {/* 11 Right Handles (Source) */}
            <Handle type="source" position={Position.Right} id="right-0" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '10%' }} />
            <Handle type="source" position={Position.Right} id="right-1" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '18%' }} />
            <Handle type="source" position={Position.Right} id="right-2" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '26%' }} />
            <Handle type="source" position={Position.Right} id="right-3" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '34%' }} />
            <Handle type="source" position={Position.Right} id="right-4" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '42%' }} />
            <Handle type="source" position={Position.Right} id="right-5" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '50%' }} />
            <Handle type="source" position={Position.Right} id="right-6" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '58%' }} />
            <Handle type="source" position={Position.Right} id="right-7" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '66%' }} />
            <Handle type="source" position={Position.Right} id="right-8" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '74%' }} />
            <Handle type="source" position={Position.Right} id="right-9" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '82%' }} />
            <Handle type="source" position={Position.Right} id="right-10" className="!w-0 !h-0 !opacity-0 !border-none" style={{ top: '90%' }} />
        </div>
    );
};

import { getSmoothStepPath } from '@xyflow/react';

// Custom Edge Component for NotebookLM's organic curves
const MindMapEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
}: EdgeProps) => {
    // Use SmoothStep for track maps (Cleaner grid look), Bezier for personal map
    const isTrack = (data as any)?.isTrack;

    const edgeParams = {
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    };

    // Use SmoothStep for track maps (to get that 'fork' logic), Bezier for personal map
    const [edgePath] = isTrack
        ? getSmoothStepPath({ ...edgeParams, borderRadius: 20 })
        : getBezierPath(edgeParams);

    const edgeColor = (data as any)?.color || '#94a3b8';

    return (
        <BaseEdge
            path={edgePath}
            markerEnd={markerEnd}
            style={{
                ...style,
                strokeWidth: 2,
                stroke: edgeColor,
                opacity: 0.6
            }}
        />
    );
};

const AnimationStyles = ({ duration }: { duration: number }) => (
    <style jsx global>{`
        .react-flow__node {
            transition: transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) !important;
            will-change: transform;
        }
        .react-flow__edge-path {
            transition-property: d, opacity, stroke !important;
            transition-duration: ${duration}ms !important;
            transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1) !important;
            will-change: d, opacity;
        }
    `}</style>
);

// Custom Edge that accepts a centerX via data for routing control
const SmartEdge = (props: EdgeProps) => {
    const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, data, target } = props;

    const pathOptions = data?.pathOptions as any;
    const centerOffset = pathOptions?.centerOffset;
    const targetOffsetY = pathOptions?.targetOffsetY || 0;
    const sourceOffsetY = pathOptions?.sourceOffsetY || 0;

    const adjustedTargetY = targetY + targetOffsetY;
    const adjustedSourceY = sourceY + sourceOffsetY;

    const hasCustomCenter = centerOffset !== undefined && centerOffset !== null;

    const [edgePath] = getSmoothStepPath({
        sourceX, sourceY: adjustedSourceY, sourcePosition,
        targetX, targetY: adjustedTargetY, targetPosition,
        borderRadius: 20,
        centerX: hasCustomCenter ? (sourceX + targetX) / 2 + centerOffset : undefined,
        offset: pathOptions?.offset || 20,
    });

    const isHighlighted = (data as any)?.isHighlighted;

    return (
        <g className={`react-flow__edge-smart group/edge ${isHighlighted ? 'z-50' : ''}`}>
            {/* Invisible interaction path */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                className="react-flow__edge-interaction cursor-pointer"
            />
            {/* Visible path with highlight support */}
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                className={isHighlighted ? 'edge-highlight-path' : ''}
                style={{
                    ...style,
                    stroke: isHighlighted ? '#F59E0B' : style.stroke, // Highlight color
                    transition: 'stroke 0.3s, stroke-width 0.3s'
                }}
            />
        </g>
    );
};

const nodeTypes = {
    mindmap: MindMapNode,
};

const edgeTypes = {
    mindmap: MindMapEdge,
    smart: SmartEdge,
};

const HighlightingStyles = () => (
    <style jsx global>{`
        @keyframes dashdraw {
            from {
                stroke-dashoffset: 20;
            }
            to {
                stroke-dashoffset: 0;
            }
        }
        .edge-highlight-path {
            stroke-dasharray: 10, 10;
            animation: dashdraw 0.5s linear infinite;
            stroke-opacity: 1 !important;
            stroke-width: 4px !important;
        }
    `}</style>
);

import { TRACKS_DATA } from '../../data/tracks';

// Helper for Map Control Buttons with Custom Tooltip (Left Side)
const ControlButton = ({ onClick, icon: Icon, label, active = false }: { onClick: () => void, icon: any, label: string, active?: boolean }) => (
    <div className="relative flex items-center group/tooltip">
        {/* Tooltip - Appears on Left */}
        <div className="absolute right-[110%] top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl relative">
                {label}
                {/* Arrow pointing right */}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-slate-900 rotate-45"></div>
            </div>
        </div>

        <Button
            variant="none"
            size="none"
            onClick={onClick}
            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center ${active ? 'bg-slate-100 text-blue-600 dark:bg-slate-800 dark:text-blue-400' : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}
        >
            <Icon size={16} />
        </Button>
    </div>
);

const MindMapContent = ({ data, externalTrackId, onBackToPersonal }: { data: any; externalTrackId: string | null; onBackToPersonal?: () => void }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
    const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
    const [isFullscreen, setIsFullscreen] = useState(!!externalTrackId);
    const [mounted, setMounted] = useState(false);
    const [hasBroughtToLife, setHasBroughtToLife] = useState(false);
    const [lastAction, setLastAction] = useState<{ id: string; type: 'expand' | 'collapse' } | null>(null);
    const [mapMode, setMapMode] = useState<'personal' | 'general' | 'media' | 'bigdata'>('personal');
    const [activeTrackNodeId, setActiveTrackNodeId] = useState<string | null>(null);
    const { fitView, zoomIn, zoomOut, getViewport, setViewport } = useReactFlow();
    const isStandalone = !!externalTrackId;

    // Reset hasBroughtToLife when mapMode changes to force a fitView
    useEffect(() => {
        setHasBroughtToLife(false);
    }, [mapMode]);

    // Sync externalTrackId to mapMode and auto-trigger fullscreen
    useEffect(() => {
        if (externalTrackId) {
            setMapMode(externalTrackId as any);
            setIsFullscreen(true);
        } else {
            setMapMode('personal');
            setIsFullscreen(false);
        }
    }, [externalTrackId]);

    // Trigger overview zoom when entering fullscreen for track maps
    useEffect(() => {
        if (isFullscreen && mapMode !== 'personal' && nodes.length > 0) {
            const timer = setTimeout(() => {
                fitView({
                    duration: 800,
                    padding: 0.2,
                    minZoom: 0.1,
                    maxZoom: 0.8
                });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isFullscreen, mapMode, nodes.length, fitView]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. TOGGLE LOGIC
    const toggleNode = useCallback((nodeId: string) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
                setLastAction({ id: nodeId, type: 'expand' });
            } else {
                next.add(nodeId);
                setLastAction({ id: nodeId, type: 'collapse' });
            }
            return next;
        });
    }, []);

    // 2. Data Population
    useEffect(() => {
        if (!data) return;

        const initialNodes: any[] = [];
        const initialEdges: any[] = [];
        let globalNodeIndex = 0;

        // Get student completed courses for highlighting
        const completedCourseIds = new Set(
            data.education?.semesters?.flatMap((s: any) => s.courses.map((c: any) => c.courseId.replace(/[-\s]/g, '').toUpperCase())) || []
        );

        const defaultCollapsed = new Set<string>();

        if (mapMode === 'personal') {
            const rootId = 'root';
            const firstName = data?.account?.name ? data.account.name.split(' ')[0] : 'Academic';
            initialNodes.push({
                id: rootId,
                type: 'mindmap',
                data: { label: `${firstName}'s Academy Map`, level: 0, collapsed: false, onToggle: toggleNode, index: globalNodeIndex++, isPersonal: true },
                position: { x: 0, y: 0 },
            });

            const semesters = data.education?.semesters || [];
            semesters.forEach((semester: any, semIdx: number) => {
                const semId = `sem-${semIdx}`;
                initialNodes.push({
                    id: semId,
                    type: 'mindmap',
                    data: { label: semester.term, level: 1, collapsed: false, onToggle: toggleNode, index: globalNodeIndex++, isPersonal: true },
                    position: { x: 0, y: 0 },
                });
                defaultCollapsed.add(semId); // Default collapse semesters
                initialEdges.push({
                    id: `e-root-${semId}`,
                    source: 'root',
                    target: semId,
                    type: 'mindmap',
                    data: { color: '#4F46E5' }
                });

                semester.courses.forEach((course: any, courseIdx: number) => {
                    const courseId = `course-${semIdx}-${courseIdx}`;
                    initialNodes.push({
                        id: courseId,
                        type: 'mindmap',
                        data: { label: course.courseName, level: 2, collapsed: false, onToggle: toggleNode, index: globalNodeIndex++, isPersonal: true },
                        position: { x: 0, y: 0 },
                    });
                    defaultCollapsed.add(courseId); // Default collapse courses

                    initialEdges.push({
                        id: `e-${semId}-${courseId}`,
                        source: semId,
                        target: courseId,
                        type: 'mindmap',
                        data: { color: '#818CF8' }
                    });

                    // ADD MISSING LEAF NODES (Grade & GPA)
                    const gradeId = `${courseId}-grade`;
                    const gpaId = `${courseId}-gpa`;

                    initialNodes.push({
                        id: gradeId,
                        type: 'mindmap',
                        data: { label: `Grade: ${course.grade || 'N/A'}`, level: 3, collapsed: false, index: globalNodeIndex++, isPersonal: true },
                        position: { x: 0, y: 0 },
                    });
                    initialNodes.push({
                        id: gpaId,
                        type: 'mindmap',
                        data: { label: `GPA: ${course.gpa || 'N/A'}`, level: 3, collapsed: false, index: globalNodeIndex++, isPersonal: true },
                        position: { x: 0, y: 0 },
                    });

                    initialEdges.push({
                        id: `e-${courseId}-${gradeId}`,
                        source: courseId,
                        target: gradeId,
                        type: 'mindmap',
                        data: { color: '#cbd5e1' }
                    });
                    initialEdges.push({
                        id: `e-${courseId}-${gpaId}`,
                        source: courseId,
                        target: gpaId,
                        type: 'mindmap',
                        data: { color: '#cbd5e1' }
                    });
                });
            });
        } else {
            // Populate nodes for Track Modes
            const track = TRACKS_DATA[mapMode as keyof typeof TRACKS_DATA];
            if (track) {
                track.nodes.forEach((node: any) => {
                    initialNodes.push({
                        id: node.id,
                        type: node.type || 'mindmap',
                        data: {
                            label: node.label,
                            level: 2,
                            collapsed: false,
                            category: node.category,
                            track: true // Marker for custom styling
                        },
                        position: node.position || { x: 0, y: 0 }, // Use explicit position if available
                    });
                });

                track.edges.forEach((edge: any) => {
                    const targetHandle = (edge as any).targetHandle || 'left-5';
                    const sourceHandle = (edge as any).sourceHandle || 'right-5';
                    const isHighlighted = activeTrackNodeId === edge.target;

                    initialEdges.push({
                        id: (edge as any).id || `e-${edge.source}-${edge.target}`,
                        source: edge.source,
                        target: edge.target,
                        sourceHandle: sourceHandle,
                        targetHandle: targetHandle,
                        type: 'smart',
                        markerEnd: { type: MarkerType.ArrowClosed },
                        data: {
                            color: isHighlighted ? '#F59E0B' : '#64748b',
                            isTrack: true,
                            isHighlighted: isHighlighted,
                            pathOptions: (edge as any).data?.pathOptions || {
                                offset: 20,
                                centerOffset: 0,
                                targetOffsetY: 0,
                                sourceOffsetY: 0
                            }
                        }
                    });
                });
            }
        }

        // Use default collapsed set on first load
        const effectiveCollapsed = nodes.length === 0 && mapMode === 'personal' ? defaultCollapsed : collapsedIds;
        if (nodes.length === 0 && mapMode === 'personal') {
            setCollapsedIds(defaultCollapsed);
        }

        const calculateLayout = () => {
            const hiddenStatus: Record<string, boolean> = {};
            const positions: Record<string, { x: number; y: number }> = {};

            if (mapMode === 'personal') {
                const isRootCollapsed = effectiveCollapsed.has('root');
                positions['root'] = { x: 0, y: 0 };
                hiddenStatus['root'] = false;

                let currentY = 0;
                const horizontalGap = 350;
                const courseVerticalGap = 85;
                const expandedCourseHeight = 170;
                const collapsedCourseHeight = courseVerticalGap;
                const expandedSemesterPadding = 120;
                const collapsedSemesterPadding = 40;
                const collapsedSemHeight = 60;

                const semesters = data?.education?.semesters || [];
                semesters.forEach((semester: any, semIdx: number) => {
                    const semId = `sem-${semIdx}`;
                    const semCourses = semester.courses || [];
                    const isSemCollapsed = effectiveCollapsed.has(semId);

                    hiddenStatus[semId] = isRootCollapsed;
                    let semesterAccY = 0;

                    if (!isSemCollapsed && !isRootCollapsed) {
                        semCourses.forEach((course: any, courseIdx: number) => {
                            const courseId = `course-${semIdx}-${courseIdx}`;
                            const isCourseCollapsed = effectiveCollapsed.has(courseId);

                            hiddenStatus[courseId] = false;
                            const heightUsedByCourse = isCourseCollapsed ? collapsedCourseHeight : expandedCourseHeight;

                            const courseY = currentY + semesterAccY + heightUsedByCourse / 2;
                            positions[courseId] = { x: horizontalGap * 2, y: courseY };

                            const gradeId = `${courseId}-grade`;
                            const gpaId = `${courseId}-gpa`;
                            hiddenStatus[gradeId] = isCourseCollapsed;
                            hiddenStatus[gpaId] = isCourseCollapsed;

                            const courseNameLength = course.courseName?.length || 0;
                            const extraSpacing = courseNameLength > 20 ? (courseNameLength - 20) * 4 : 0;
                            const childHorizontalX = (horizontalGap * 2) + 400 + extraSpacing;

                            const childVerticalSpacing = 45;
                            positions[gradeId] = { x: childHorizontalX, y: courseY - childVerticalSpacing };
                            positions[gpaId] = { x: childHorizontalX, y: courseY + childVerticalSpacing };

                            semesterAccY += heightUsedByCourse + 20;
                        });
                    } else {
                        semCourses.forEach((course: any, courseIdx: number) => {
                            const courseId = `course-${semIdx}-${courseIdx}`;
                            hiddenStatus[courseId] = true;
                            hiddenStatus[`${courseId}-grade`] = true;
                            hiddenStatus[`${courseId}-gpa`] = true;
                        });
                        semesterAccY = collapsedSemHeight;
                    }

                    const semY = currentY + semesterAccY / 2;
                    positions[semId] = { x: horizontalGap, y: semY };
                    currentY += semesterAccY + (isSemCollapsed ? collapsedSemesterPadding : expandedSemesterPadding);
                });

                const centeringOffset = (currentY - (semesters.length > 0 ? (effectiveCollapsed.has(`sem-${semesters.length - 1}`) ? collapsedSemesterPadding : expandedSemesterPadding) : 0)) / 2;
                Object.keys(positions).forEach(id => {
                    if (id !== 'root') positions[id].y -= centeringOffset;
                });
            } else {
                // Precise Grid Layout for Track Maps
                const track = TRACKS_DATA[mapMode as keyof typeof TRACKS_DATA];

                if (!track) {
                    return { positions, hiddenStatus };
                }

                const horizontalGap = 600;
                const verticalGap = 200;

                let minX = Infinity, maxX = -Infinity;
                let minY = Infinity, maxY = -Infinity;

                track.nodes.forEach(node => {
                    const col = (node as any).gridPos?.col ?? 0;
                    const row = (node as any).gridPos?.row ?? 0;

                    // PRIORITIZE EXPLICIT POSITIONS
                    let x, y;
                    if ((node as any).position) {
                        x = (node as any).position.x;
                        y = (node as any).position.y;
                    } else {
                        x = col * horizontalGap;
                        y = row * verticalGap;
                    }

                    positions[node.id] = { x, y };
                    hiddenStatus[node.id] = false;

                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                });

                // Center the entire grid
                const offsetX = (maxX + minX) / 2;
                const offsetY = (maxY + minY) / 2;

                Object.keys(positions).forEach(id => {
                    positions[id].x -= offsetX;
                    positions[id].y -= offsetY;
                });
            }

            return { positions, hiddenStatus };
        };

        const { positions, hiddenStatus } = calculateLayout();



        // Apply positions and hidden status to initial nodes
        const finalizedNodes = initialNodes.map(node => ({
            ...node,
            position: positions[node.id] || node.position,
            hidden: hiddenStatus[node.id],
            data: { ...node.data, collapsed: effectiveCollapsed.has(node.id) }
        }));

        const finalizedEdges = initialEdges.map(edge => ({
            ...edge,
            hidden: hiddenStatus[edge.source] || hiddenStatus[edge.target],
            style: {
                ...edge.style,
                stroke: edge.data?.color || '#94a3b8',
                strokeWidth: 3,
                opacity: (hiddenStatus[edge.source] || hiddenStatus[edge.target]) ? 0 : 1
            }
        }));

        setNodes(finalizedNodes);

        // Finalize edges with dimming effect for non-highlighted ones in track mode
        const finalEdgesWithDimming = finalizedEdges.map(edge => {
            if (mapMode !== 'personal' && activeTrackNodeId) {
                const isHighlight = edge.data?.isHighlighted;
                return {
                    ...edge,
                    style: {
                        ...edge.style,
                        opacity: isHighlight ? 1 : 0.2,
                    }
                };
            }
            return edge;
        });

        setEdges(finalEdgesWithDimming);

    }, [collapsedIds, data, mapMode, activeTrackNodeId]);

    const toggleFullscreen = () => {
        if (isStandalone) {
            onBackToPersonal?.();
            return;
        }

        setIsFullscreen(!isFullscreen);
    };

    const expandAll = () => {
        setCollapsedIds(new Set());
        setLastAction(null);
        setTimeout(() => fitView({ duration: 800, padding: 0.4, minZoom: 0.6 }), 50);
    };

    const collapseAll = () => {
        const expandableIds = nodes.filter(n => n.data.level >= 1 && n.data.level < 3).map(n => n.id);
        const rootId = 'root';
        setCollapsedIds(new Set([rootId, ...expandableIds]));
        setLastAction(null);
        const duration = mapMode === 'personal' ? 800 : 100;
        setTimeout(() => fitView({ duration, padding: 0.4, minZoom: 0.6 }), mapMode === 'personal' ? 50 : 10);
    };

    useEffect(() => {
        if (lastAction) {
            const timer = setTimeout(() => {
                const childIds = edges.filter(e => e.source === lastAction.id).map(e => e.target);
                const nodesToFocus = nodes.filter(n => n.id === lastAction.id || (lastAction.type === 'expand' && childIds.includes(n.id)));

                if (nodesToFocus.length > 0) {
                    fitView({
                        nodes: nodesToFocus,
                        duration: mapMode === 'personal' ? (lastAction.type === 'expand' ? 1200 : 1000) : 100,
                        padding: lastAction.type === 'expand' ? 0.7 : 1.2,
                        minZoom: 0.4,
                        maxZoom: 1.1
                    });
                }
            }, mapMode === 'personal' ? 50 : 10);
            return () => clearTimeout(timer);
        } else if (nodes.length > 0 && !hasBroughtToLife) {
            setHasBroughtToLife(true);
            const duration = mapMode === 'personal' ? 1200 : 800;
            const delay = mapMode === 'personal' ? 500 : 100;
            const padding = mapMode === 'personal' ? 0.15 : 0.2;
            const minZoom = mapMode === 'personal' ? 0.4 : 0.1;
            const maxZoom = mapMode === 'personal' ? 1.5 : 0.8;
            const performFit = () => {
                // Use standard fitView with smooth animation for both mobile and desktop
                // Adjust zoom limits for mobile to ensure content fits properly
                const isMobile = window.innerWidth < 768;
                fitView({
                    duration: 800,
                    padding: isMobile ? 0.2 : padding,
                    minZoom: isMobile ? 0.2 : minZoom, // Allow zooming out more on mobile to fit width
                    maxZoom
                });
            };

            // Small delay to ensure graph is rendered before fitting
            setTimeout(performFit, isStandalone ? 100 : delay);
        }
    }, [collapsedIds, fitView, nodes, edges, lastAction, hasBroughtToLife, mapMode]);

    // 4. INTERACTION LOGIC REMOVED (FINALIZED)

    const flowContent = (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={(params) => setEdges((eds) => addEdge({ ...params, type: 'smart', markerEnd: { type: MarkerType.ArrowClosed }, data: { isTrack: true, color: '#64748b' } }, eds))}
            onNodeClick={(_, node) => {
                if (mapMode !== 'personal') {
                    setActiveTrackNodeId(node.id);

                    // Find all prerequisite nodes (sources of edges targeting this node)
                    const prerequisiteNodeIds = edges
                        .filter(e => e.target === node.id)
                        .map(e => e.source);

                    // Get all nodes to focus (clicked node + prerequisites)
                    const nodesToFocus = nodes.filter(n =>
                        n.id === node.id || prerequisiteNodeIds.includes(n.id)
                    );

                    // Zoom to these nodes
                    if (nodesToFocus.length > 0) {
                        setTimeout(() => {
                            fitView({
                                nodes: nodesToFocus,
                                duration: 800,
                                padding: 0.3,
                                maxZoom: 1.2,
                                minZoom: 0.4
                            });
                        }, 100);
                    }
                }
            }}
            onPaneClick={() => {
                if (mapMode !== 'personal') {
                    setActiveTrackNodeId(null);
                }
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={mapMode === 'personal'}
            nodesConnectable={mapMode === 'personal'}
            elementsSelectable={true}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
        >
            <Background color="currentColor" className="text-slate-200 dark:text-slate-800/0" gap={25} size={1} />
            <Panel position="top-right" className="flex flex-col gap-2 m-4 scale-90 origin-top-right">
                <div className="flex flex-col gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] shadow-lg p-1">
                    <ControlButton
                        onClick={toggleFullscreen}
                        label={isStandalone ? "Close Map" : isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        icon={isStandalone ? X : isFullscreen ? Minimize2 : Maximize2}
                        active={false}
                    />
                </div>
            </Panel>

            <Panel position="bottom-right" className="flex flex-col gap-2 m-4 scale-75 md:scale-90 origin-bottom-right">
                {mapMode === 'personal' && (
                    <div className="flex flex-col gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.25rem] shadow-lg p-1">
                        {collapsedIds.size === 0 ? (
                            <ControlButton
                                onClick={collapseAll}
                                label="Collapse All"
                                icon={ChevronsDownUp}
                            />
                        ) : (
                            <ControlButton
                                onClick={expandAll}
                                label="Expand All"
                                icon={ChevronsUpDown}
                            />
                        )}
                    </div>
                )}

                <div className="flex flex-col gap-1 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[1.25rem] shadow-xl p-1.5 ring-4 ring-black/5">
                    <ControlButton
                        onClick={() => fitView({ duration: 400 })}
                        label="Reset View"
                        icon={RotateCcw}
                    />
                    <div className="h-px bg-slate-200 mx-1"></div>
                    <ControlButton
                        onClick={() => zoomIn({ duration: 400 })}
                        label="Zoom In"
                        icon={ZoomIn}
                    />
                    <ControlButton
                        onClick={() => zoomOut({ duration: 400 })}
                        label="Zoom Out"
                        icon={ZoomOut}
                    />
                </div>
            </Panel>
            <AnimationStyles duration={600} />
            <HighlightingStyles />
        </ReactFlow>
    );

    return (
        <div className="relative w-full h-full group/mindmap">
            {isFullscreen && mounted ? createPortal(
                <div className="fixed inset-0 z-[99999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 md:p-8">
                    <div className={`w-full h-full bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden relative ${mapMode !== 'personal' ? 'animate-in zoom-in-95 duration-700' : ''}`}>
                        <div className="absolute top-0 left-0 right-0 p-4 md:p-10 z-20 flex items-start justify-between pointer-events-none">
                            <div className="pointer-events-auto bg-white/40 backdrop-blur-md px-4 py-2 md:px-6 md:py-3 rounded-2xl border border-white/20 shadow-sm flex items-center gap-4">
                                <h2 className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">
                                    {mapMode === 'personal'
                                        ? `${data?.account?.name ? data.account.name.split(' ')[0] : 'Academic'}'s Academy Map`
                                        : mapMode === 'general' ? 'General Track'
                                            : mapMode === 'media' ? 'Media Track'
                                                : 'Big Data Track'}
                                </h2>
                            </div>
                        </div>
                        <div className="w-full h-full">{flowContent}</div>
                    </div>
                </div>,
                document.body
            ) : (
                !isStandalone && (
                    <div className="w-full h-full bg-white transition-all overflow-hidden relative">
                        <div className="absolute top-6 left-6 z-20 pointer-events-none hidden md:block">
                            <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-200/50 shadow-sm">
                                <h2 className="text-sm font-black text-slate-800 tracking-tight">
                                    {data?.account?.name ? data.account.name.split(' ')[0] : 'Academic'}'s Academy Map
                                </h2>
                            </div>
                        </div>
                        {flowContent}
                    </div>
                )
            )}
        </div>
    );
};

export default function AcademicMindMap({ data, selectedTrackId, onBackToPersonal }: { data: any; selectedTrackId?: string | null; onBackToPersonal?: () => void }) {
    return (
        <ReactFlowProvider>
            <MindMapContent data={data} externalTrackId={selectedTrackId || null} onBackToPersonal={onBackToPersonal} />
        </ReactFlowProvider>
    );
}
