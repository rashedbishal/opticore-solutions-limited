import React, { forwardRef } from 'react';

/**
 * Robot Component - Premium SVG-based animatable robot
 * Optimized for GSAP transformations and scroll-driven motion.
 */
const Robot = forwardRef(
    (
        {
            headRef,
            eyesRef,
            bodyRef,
            leftArmRef,
            rightArmRef,
            scannerRef,
            glowRef,
        },
        ref,
    ) => {
        return (
            <div
                ref={ref}
                className="robot-container relative h-80 w-80 will-change-transform"
                style={{ perspective: '1200px' }}
            >
                {/* Dynamic Background Glow */}
                <div
                    ref={glowRef}
                    className="robot-glow pointer-events-none absolute inset-0 rounded-full opacity-40 transition-opacity duration-700"
                    style={{
                        background:
                            'radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(139,92,246,0.3) 50%, transparent 80%)',
                        filter: 'blur(50px)',
                        transform: 'scale(1.5)',
                    }}
                />

                {/* SVG Robot */}
                <svg
                    viewBox="0 0 200 200"
                    className="robot-svg relative z-10 h-full w-full drop-shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient
                            id="robotBodyGradient"
                            x1="0%"
                            y1="0%"
                            x2="100%"
                            y2="100%"
                        >
                            <stop offset="0%" stopColor="#0891b2" />
                            <stop offset="100%" stopColor="#4c1d95" />
                        </linearGradient>

                        <filter
                            id="neonGlow"
                            x="-50%"
                            y="-50%"
                            width="200%"
                            height="200%"
                        >
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        <radialGradient
                            id="eyeRadial"
                            cx="50%"
                            cy="50%"
                            r="50%"
                        >
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="40%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#0891b2" />
                        </radialGradient>
                    </defs>

                    {/* Arms - Positioned behind body */}
                    <g ref={leftArmRef} transform="translate(45, 115)">
                        <rect
                            x="-10"
                            y="0"
                            width="18"
                            height="55"
                            rx="9"
                            fill="url(#robotBodyGradient)"
                            stroke="#22d3ee"
                            strokeWidth="1"
                        />
                        <circle
                            cx="-1"
                            cy="55"
                            r="12"
                            fill="#1e1b4b"
                            stroke="#22d3ee"
                            filter="url(#neonGlow)"
                        />
                    </g>

                    <g ref={rightArmRef} transform="translate(155, 115)">
                        <rect
                            x="-8"
                            y="0"
                            width="18"
                            height="55"
                            rx="9"
                            fill="url(#robotBodyGradient)"
                            stroke="#22d3ee"
                            strokeWidth="1"
                        />
                        <circle
                            cx="1"
                            cy="55"
                            r="12"
                            fill="#1e1b4b"
                            stroke="#22d3ee"
                            filter="url(#neonGlow)"
                        />
                    </g>

                    {/* Body Core */}
                    <g ref={bodyRef} transform="translate(100, 125)">
                        <path
                            d="M -45,-25 L 45,-25 L 45,30 L 0,60 L -45,30 Z"
                            fill="#1e1b4b"
                            stroke="url(#robotBodyGradient)"
                            strokeWidth="3"
                        />
                        {/* Energy Core */}
                        <circle
                            cx="0"
                            cy="5"
                            r="18"
                            fill="#0891b2"
                            opacity="0.15"
                        />
                        <circle
                            cx="0"
                            cy="5"
                            r="8"
                            fill="#22d3ee"
                            filter="url(#neonGlow)"
                            className="animate-pulse"
                        />

                        {/* Tech Lines */}
                        <line
                            x1="-30"
                            y1="-10"
                            x2="30"
                            y2="-10"
                            stroke="#4c1d95"
                            strokeWidth="1"
                            opacity="0.5"
                        />
                        <line
                            x1="-20"
                            y1="20"
                            x2="20"
                            y2="20"
                            stroke="#4c1d95"
                            strokeWidth="1"
                            opacity="0.5"
                        />
                    </g>

                    {/* Head Assembly */}
                    <g ref={headRef} transform="translate(100, 65)">
                        {/* Neck */}
                        <rect
                            x="-12"
                            y="15"
                            width="24"
                            height="20"
                            rx="4"
                            fill="#1e1b4b"
                            stroke="#4c1d95"
                        />

                        {/* Main Head Helmet */}
                        <rect
                            x="-45"
                            y="-40"
                            width="90"
                            height="65"
                            rx="22"
                            fill="#1e1b4b"
                            stroke="#22d3ee"
                            strokeWidth="2.5"
                        />

                        {/* Antenna */}
                        <line
                            x1="0"
                            y1="-40"
                            x2="0"
                            y2="-55"
                            stroke="#22d3ee"
                            strokeWidth="3"
                        />
                        <circle
                            cx="0"
                            cy="-55"
                            r="6"
                            fill="#22d3ee"
                            filter="url(#neonGlow)"
                        />

                        {/* Eyes Interface */}
                        <g ref={eyesRef}>
                            <rect
                                x="-35"
                                y="-15"
                                width="70"
                                height="25"
                                rx="12"
                                fill="#000000"
                            />
                            <circle
                                cx="-18"
                                cy="-3"
                                r="6"
                                fill="url(#eyeRadial)"
                                filter="url(#neonGlow)"
                            />
                            <circle
                                cx="18"
                                cy="-3"
                                r="6"
                                fill="url(#eyeRadial)"
                                filter="url(#neonGlow)"
                            />

                            {/* Horizontal Scanner Beam (Hidden by default) */}
                            <rect
                                ref={scannerRef}
                                x="-30"
                                y="-3"
                                width="60"
                                height="1.5"
                                fill="#22d3ee"
                                opacity="0"
                                filter="url(#neonGlow)"
                            />
                        </g>
                    </g>
                </svg>
            </div>
        );
    },
);

Robot.displayName = 'Robot';

export default Robot;
