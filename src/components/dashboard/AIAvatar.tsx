'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AIAvatarProps {
    mouseX?: number;
    mouseY?: number;
    isActive?: boolean;
}

const AIAvatar = ({ mouseX, mouseY, isActive }: AIAvatarProps = {}) => {
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [localIsHovering, setLocalIsHovering] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);

    // Use external props if provided, otherwise fallback to local state (though local handlers are removed in this usage pattern if controlled externally)
    const isHovering = isActive !== undefined ? isActive : localIsHovering;

    useEffect(() => {
        if (!avatarRef.current || !isHovering) {
            if (!isHovering) setEyePosition({ x: 0, y: 0 });
            return;
        }

        // Use provided mouse coordinates or skip if not provided
        const clientX = mouseX;
        const clientY = mouseY;

        if (clientX === undefined || clientY === undefined) return;

        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate mouse position relative to avatar center
        const deltaX = clientX - centerX;
        const deltaY = clientY - centerY;

        // Calculate angle
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);
        const maxMovement = 15; // Maximum eye movement in pixels

        // Calculate eye position (scaled down for subtle effect)
        // We increase the divisor slightly for smoother tracking over long distances
        const moveX = Math.cos(angle) * Math.min(distance / 5, maxMovement);
        const moveY = Math.sin(angle) * Math.min(distance / 5, maxMovement);

        setEyePosition({ x: moveX, y: moveY });
    }, [mouseX, mouseY, isHovering]);

    // Local handlers only work if NO external control is active
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActive !== undefined) return; // Ignore local events if externally controlled

        // ... local logic could go here if needed, but we are shifting to parent control
    };

    const handleMouseEnter = () => {
        if (isActive === undefined) setLocalIsHovering(true);
    };

    const handleMouseLeave = () => {
        if (isActive === undefined) {
            setLocalIsHovering(false);
            setEyePosition({ x: 0, y: 0 });
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-start justify-start p-6 md:p-10 overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Actual Background Image from public/omni-bg.png */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 pointer-events-none"
                style={{ backgroundImage: 'url("/omni-bg.png")' }}
            ></div>

            <div className="relative scale-90 md:scale-100 origin-top-left pointer-events-none">
                {/* Outer Circle - Steered by "omni-look" and "omni-rotate" */}
                <div ref={avatarRef} className="relative w-44 h-44 animate-[omni-look_15s_ease-in-out_infinite]">
                    <div className="absolute inset-0 animate-[omni-rotate_20s_linear_infinite]">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-5 h-5 bg-blue-900 rounded-[30%] left-1/2 top-0 shadow-[0_0_15px_rgba(74,158,255,0.2)]"
                                style={{
                                    marginLeft: '-10px',
                                    transformOrigin: '10px 88px',
                                    transform: `rotate(${i * 30}deg)`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Eyes - Precisely Centered with Mouse Tracking */}
                <div
                    className={`absolute flex items-center justify-center gap-4 ${!isHovering ? 'transition-transform duration-700 ease-in-out' : ''}`}
                    style={{
                        width: '80px',
                        left: '50%',
                        top: '50%',
                        transform: isHovering
                            ? `translate(calc(-50% + ${eyePosition.x}px), calc(-50% + ${eyePosition.y}px))`
                            : 'translate(-50%, -50%)'
                    }}
                >
                    {/* Left Eye */}
                    <div className="w-6 h-6 bg-blue-900 rounded-[30%] animate-[eye-blink_6s_ease-in-out_infinite] shadow-[0_0_15px_rgba(74,158,255,0.3)]"></div>
                    {/* Right Eye */}
                    <div className="w-6 h-6 bg-blue-900 rounded-[30%] animate-[eye-blink_6s_ease-in-out_infinite] shadow-[0_0_15px_rgba(74,158,255,0.3)]"></div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes eye-blink {
                    0%, 15%, 100% { transform: scaleY(1); }
                    7% { transform: scaleY(0.05); }
                }

                @keyframes omni-rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                /* Minimal movement: Same style, but happens twice and further */
                @keyframes omni-look {
                    0%, 25%, 35%, 75%, 85%, 100% { transform: translate(0, 0); }
                    30%, 80% { transform: translate(4px, 2px); }
                }

                @keyframes omni-look-eyes {
                    0%, 25%, 35%, 75%, 85%, 100% { transform: translate(0, 0); }
                    30%, 80% { transform: translate(15px, 7px); }
                }
            `}</style>
        </div>
    );
};

export default AIAvatar;
