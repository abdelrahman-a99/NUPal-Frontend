// 'use client';

// export function BackgroundAnimation() {
//     return (
//         <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
//             {/*
//                 Using viewBox="0 0 100 100" with preserveAspectRatio="none" maps the 0-100 coordinates
//                 to 0%-100% of the container width/height.
//                 vectorEffect="non-scaling-stroke" ensures the lines stay 2px thick regardless of scaling.
//             */}
//             <svg
//                 className="absolute inset-0 h-full w-full"
//                 xmlns="http://www.w3.org/2000/svg"
//                 viewBox="0 0 100 100"
//                 preserveAspectRatio="none"
//             >
//                 <defs>
//                     <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
//                         <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
//                         <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
//                         <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
//                     </linearGradient>
//                 </defs>

//                 {/* --- LEFT SIDE --- */}

//                 {/* 1. Main Vertical Line (Left 10%) */}
//                 {/* M 10,0 (Top) -> L 10,80 (Down) -> L 0,90 (Left edge) */}
//                 <g>
//                     {/* Static line: "Poor" (Faint) */}
//                     <path
//                         d="M 10,0 L 10,80 L 0,90"
//                         fill="none"
//                         stroke="#bfdbfe"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="opacity-40"
//                     />
//                     {/* Animated line: "Strong" (Bright Blue) */}
//                     <path
//                         d="M 10,0 L 10,80 L 0,90"
//                         fill="none"
//                         stroke="url(#line-gradient)"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="animate-draw-line"
//                         strokeDasharray="100"
//                         strokeDashoffset="100"
//                     />
//                 </g>

//                 {/* 3. Far Left Edge Line */}
//                 {/* M 2,0 -> L 2,30 -> L 0,35 */}
//                 <g style={{ animationDelay: '2s' }}>
//                     <path
//                         d="M 2,0 L 2,30 L 0,35"
//                         fill="none"
//                         stroke="#bfdbfe"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="opacity-40"
//                     />
//                     <path
//                         d="M 2,0 L 2,30 L 0,35"
//                         fill="none"
//                         stroke="url(#line-gradient)"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="animate-draw-line"
//                         strokeDasharray="50"
//                         strokeDashoffset="50"
//                     />
//                 </g>




//                 {/* --- RIGHT SIDE --- */}

//                 {/* 4. Main Vertical Line (Right 90%) */}
//                 {/* M 90,0 -> L 90,80 -> L 100,90 */}
//                 <g>
//                     <path
//                         d="M 90,0 L 90,80 L 100,90"
//                         fill="none"
//                         stroke="#bfdbfe"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="opacity-40"
//                     />
//                     <path
//                         d="M 90,0 L 90,80 L 100,90"
//                         fill="none"
//                         stroke="url(#line-gradient)"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="animate-draw-line"
//                         strokeDasharray="100"
//                         strokeDashoffset="100"
//                     />
//                 </g>

//                 {/* 6. Far Right Edge Line */}
//                 {/* M 98,0 -> L 98,30 -> L 100,35 */}
//                 <g style={{ animationDelay: '2.5s' }}>
//                     <path
//                         d="M 98,0 L 98,30 L 100,35"
//                         fill="none"
//                         stroke="#bfdbfe"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="opacity-40"
//                     />
//                     <path
//                         d="M 98,0 L 98,30 L 100,35"
//                         fill="none"
//                         stroke="url(#line-gradient)"
//                         strokeWidth="2"
//                         vectorEffect="non-scaling-stroke"
//                         className="animate-draw-line"
//                         strokeDasharray="50"
//                         strokeDashoffset="50"
//                     />
//                 </g>

//             </svg>

//             <style jsx global>{`
//                 @keyframes draw {
//                     0% {
//                         stroke-dashoffset: 200;
//                     }
//                     50% {
//                         stroke-dashoffset: 0;
//                     }
//                     100% {
//                         stroke-dashoffset: -200;
//                     }
//                 }
//                 .animate-draw-line {
//                     animation: draw 4s ease-in-out infinite;
//                 }
//             `}</style>
//         </div>
//     );
// }
