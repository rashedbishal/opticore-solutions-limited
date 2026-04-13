import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Robot from './Robot';
import Section1 from './Section1';
import Section2 from './Section2';
import Section3 from './Section3';
import Section4 from './Section4';
import Section5 from './Section5';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * RobotScene - Orchestrates the premium scroll-driven robot animation.
 */
export default function RobotScene() {
    const containerRef = useRef(null);

    // Refs for robot parts
    const robotRef = useRef(null);
    const headRef = useRef(null);
    const eyesRef = useRef(null);
    const bodyRef = useRef(null);
    const leftArmRef = useRef(null);
    const rightArmRef = useRef(null);
    const scannerRef = useRef(null);
    const glowRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 1. Initial State
            gsap.set(robotRef.current, {
                y: 100,
                opacity: 0,
                scale: 0.8,
                rotateY: -20,
            });

            // 2. Main Timeline with ScrollTrigger
            const masterTl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1.5, // High scrub for premium smoothness
                    invalidateOnRefresh: true,
                },
            });

            // Section 1: Hero Entrance (0% - 20% of scroll)
            masterTl.to(
                robotRef.current,
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotateY: 0,
                    duration: 2,
                    ease: 'power3.out',
                },
                0,
            );

            // Section 2: Scanning Mode (20% - 40%)
            masterTl.addLabel('scanning', 2);
            masterTl.to(
                headRef.current,
                {
                    rotateY: 35,
                    duration: 1.5,
                },
                'scanning',
            );

            masterTl.to(
                scannerRef.current,
                {
                    opacity: 0.8,
                    scaleX: 1.2,
                    duration: 0.5,
                    repeat: 3,
                    yoyo: true,
                },
                'scanning',
            );

            masterTl.to(
                glowRef.current,
                {
                    backgroundColor: 'rgba(34, 211, 238, 0.6)',
                    scale: 1.8,
                    duration: 1.5,
                },
                'scanning',
            );

            // Section 3: Processing Intensity (40% - 60%)
            masterTl.addLabel('processing', 4);
            masterTl.to(
                robotRef.current,
                {
                    scale: 1.15,
                    y: -30,
                    duration: 2,
                },
                'processing',
            );

            masterTl.to(
                bodyRef.current,
                {
                    filter: 'brightness(1.8) drop-shadow(0 0 20px #22d3ee)',
                    duration: 1,
                },
                'processing',
            );

            masterTl.to(
                [leftArmRef.current, rightArmRef.current],
                {
                    rotateX: -45,
                    y: -10,
                    stagger: 0.2,
                    duration: 1.5,
                },
                'processing',
            );

            // Section 4: Confident Execution (60% - 80%)
            masterTl.addLabel('execution', 6);
            masterTl.to(
                robotRef.current,
                {
                    x: 40,
                    rotateY: -15,
                    scale: 1,
                    duration: 2,
                },
                'execution',
            );

            masterTl.to(
                headRef.current,
                {
                    rotateY: 0,
                    rotateX: 10,
                    duration: 1.5,
                },
                'execution',
            );

            masterTl.to(
                glowRef.current,
                {
                    backgroundColor: 'rgba(139, 92, 246, 0.5)',
                    scale: 1.4,
                    duration: 2,
                },
                'execution',
            );

            // Section 5: Final Evolution (80% - 100%)
            masterTl.addLabel('final', 8);
            masterTl.to(
                robotRef.current,
                {
                    x: 0,
                    y: 0,
                    scale: 1.3,
                    rotateY: 0,
                    filter: 'hue-rotate(45deg)',
                    duration: 2,
                },
                'final',
            );

            masterTl.to(
                glowRef.current,
                {
                    opacity: 1,
                    scale: 3,
                    filter: 'blur(80px)',
                    duration: 2,
                },
                'final',
            );

            // Continuous Idle Animation (Floating)
            gsap.to(robotRef.current, {
                y: '-=15',
                duration: 2.5,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={containerRef}
            className="robot-scene-wrapper relative bg-black"
        >
            {/* Fixed Robot Visuals */}
            <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
                <Robot
                    ref={robotRef}
                    headRef={headRef}
                    eyesRef={eyesRef}
                    bodyRef={bodyRef}
                    leftArmRef={leftArmRef}
                    rightArmRef={rightArmRef}
                    scannerRef={scannerRef}
                    glowRef={glowRef}
                />
            </div>

            {/* Scroll Sections */}
            <div className="relative z-10">
                <Section1 />
                <Section2 />
                <Section3 />
                <Section4 />
                <Section5 />
            </div>
        </div>
    );
}
