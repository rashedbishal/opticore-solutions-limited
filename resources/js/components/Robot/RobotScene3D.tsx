import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import type { RobotModelRef } from './RobotModel';

// Register ScrollTrigger to detect sections
gsap.registerPlugin(ScrollTrigger);
import RobotModel from './RobotModel';

/**
 * RobotScene3D - Main container for 3D robot motion graphics
 * Logic:
 * - Section 1: Center, plays hello animation
 * - Section 2: Moves to bottom left corner, plays idle animation, smaller size
 */
// A fully responsive wrapper for the robot.
// By being inside the <Canvas>, it can use useThree() to get exact viewport dimensions.
function ResponsiveRobot() {
    const { viewport } = useThree();
    const robotRef = useRef<THREE.Group>(null);
    const robotModelRef = useRef<RobotModelRef>(null);

    // Track the current animation so we can return to it after the 'death'
    const currentAnimRef = useRef<string>('idle');
    const isDeadRef = useRef<boolean>(false);

    // Dynamic initial values based on viewport size
    const isMobile = viewport.width < 8;
    const initialScale = isMobile ? 0.16 : 0.27; 
    const initialY = isMobile ? -0.5 : -1.0;

    // State machine trackers
    const introFinishedRef = useRef<boolean>(false);
    const activeSectionRef = useRef<number>(0);
    const lastHandledSectionRef = useRef<number>(0);
    const isMovingRef = useRef<boolean>(false);
    const currentCornerIndexRef = useRef<number>(0); // 0 = Bottom Left
    const checkMovementRef = useRef<() => void>(() => {});

    useEffect(() => {
        if (!robotRef.current) return;

        const triggers: ScrollTrigger[] = [];
        const paddingX = isMobile ? 0.8 : 0.85; 
        const paddingBottomY = isMobile ? 0.8 : 0.85;
        // Apply far stricter padding on the top bound to safely avoid the navbar
        const paddingTopY = isMobile ? 0.15 : 0.25; 
        const targetScale = isMobile ? 0.08 : 0.16;

        // The 4 screen corners based on viewport size
        const corners = [
            { id: 0, x: -(viewport.width / 2) * paddingX, y: -(viewport.height / 2) * paddingBottomY },
            { id: 1, x: -(viewport.width / 2) * paddingX, y:  (viewport.height / 2) * paddingTopY },
            { id: 2, x:  (viewport.width / 2) * paddingX, y:  (viewport.height / 2) * paddingTopY },
            { id: 3, x:  (viewport.width / 2) * paddingX, y: -(viewport.height / 2) * paddingBottomY },
        ];

        const playRandomAnim = () => {
            const anims = ['idle', 'dance', 'jump', 'punch', 'hello'];
            const randomAnim = anims[Math.floor(Math.random() * anims.length)];
            currentAnimRef.current = randomAnim;
            if (!isDeadRef.current) robotModelRef.current?.playAnimation(randomAnim);
        };

        const checkAndTriggerMove = () => {
            if (!robotRef.current) return;
            if (isMovingRef.current || isDeadRef.current || !introFinishedRef.current) return;

            if (activeSectionRef.current !== lastHandledSectionRef.current) {
                // Determine a new random corner that is distinctly different from the current one
                let nextIdx = currentCornerIndexRef.current;
                while (nextIdx === currentCornerIndexRef.current) {
                    nextIdx = Math.floor(Math.random() * 4);
                }

                isMovingRef.current = true;
                lastHandledSectionRef.current = activeSectionRef.current;
                currentCornerIndexRef.current = nextIdx;
                
                const target = corners[nextIdx];
                const dx = target.x - robotRef.current.position.x;
                const dy = target.y - robotRef.current.position.y;
                
                // Calculate robot's rotation to face the corner it's running toward!
                // We use Math.atan2 with -dy to match screen coordinates correctly.
                const angle = Math.atan2(dx, -dy);

                if (!isDeadRef.current) robotModelRef.current?.playAnimation('run');

                // Snap to angle smoothly, then run across the screen
                gsap.to(robotRef.current.rotation, { y: angle, duration: 0.4, ease: "power2.out" });
                gsap.to(robotRef.current.scale, { x: targetScale, y: targetScale, z: targetScale, duration: 2, ease: "power2.inOut" });
                
                gsap.to(robotRef.current.position, { 
                    x: target.x, y: target.y, z: 0, 
                    duration: 2, ease: "power2.inOut",
                    onComplete: () => {
                        isMovingRef.current = false;
                        if (!robotRef.current) return;

                        // Force the system to acknowledge any trailing scrolls the user did while we were running, 
                        // ensuring we don't instantly queue a new run and "skip" anything in between!
                        lastHandledSectionRef.current = activeSectionRef.current;

                        // Arrived at destination. Rotate back to camera and play random anim!
                        gsap.to(robotRef.current.rotation, { y: Math.PI / 8, duration: 0.5, ease: "power2.out" });
                        playRandomAnim();
                    } 
                });
            }
        };

        // Bind check function to top-level ref so the click handler can wake it up
        checkMovementRef.current = checkAndTriggerMove;

        const setSection = (idx: number) => {
            activeSectionRef.current = idx;
            checkAndTriggerMove();
        };

        const setupScrollTriggers = () => {
            const sections = Array.from(document.querySelectorAll('section'));
            sections.forEach((sec, idx) => {
                const st = ScrollTrigger.create({
                    trigger: sec,
                    start: "top 50%",
                    end: "bottom 50%",
                    onEnter: () => setSection(idx),
                    onEnterBack: () => setSection(idx),
                });
                
                // Keep history updated if initialized midway down page
                if (st.isActive) {
                    activeSectionRef.current = idx;
                    lastHandledSectionRef.current = idx;
                }
                triggers.push(st);
            });
        };

        let tl: gsap.core.Timeline | null = null;

        if (!introFinishedRef.current) {
            // Very first page load
            if (robotModelRef.current) {
                robotModelRef.current.playAnimation('hello');
            }

            tl = gsap.timeline({
                delay: 3,
                onStart: () => {
                    if (robotModelRef.current) robotModelRef.current.playAnimation('run');
                },
                onComplete: () => {
                    introFinishedRef.current = true;
                    currentCornerIndexRef.current = 0; // Initialize at Bottom Left
                    
                    setupScrollTriggers();
                    playRandomAnim();
                    checkAndTriggerMove();
                }
            });

            tl.to(robotRef.current.position, { x: corners[0].x, y: corners[0].y, z: 0, duration: 2, ease: "power2.inOut" }, 0);
            tl.to(robotRef.current.scale,    { x: targetScale, y: targetScale, z: targetScale, duration: 2, ease: "power2.inOut" }, 0);
            tl.to(robotRef.current.rotation, { y: Math.PI / 8, duration: 2, ease: "power2.inOut" }, 0);
        } else {
            // Component re-rendered on browser resize - skip intro and instantly place robot
            const target = corners[currentCornerIndexRef.current];
            gsap.set(robotRef.current.position, { x: target.x, y: target.y, z: 0 });
            gsap.set(robotRef.current.scale, { x: targetScale, y: targetScale, z: targetScale });
            setupScrollTriggers();
        }

        return () => {
            if (tl) tl.kill(); 
            triggers.forEach(t => t.kill());
            if (robotRef.current) {
                gsap.killTweensOf(robotRef.current.position);
                gsap.killTweensOf(robotRef.current.rotation);
                gsap.killTweensOf(robotRef.current.scale);
            }
        };
    }, [viewport.width, viewport.height, isMobile]);

    const handleClick = (e: any) => {
        e.stopPropagation();
        if (robotModelRef.current && !isDeadRef.current) {
            isDeadRef.current = true;
            robotModelRef.current.playAnimation('death');
            
            // Wait 6 seconds before reviving
            setTimeout(() => {
                isDeadRef.current = false;
                if (robotModelRef.current) {
                    robotModelRef.current.playAnimation(currentAnimRef.current);
                }
                
                // In case sections scrolled past us while we were dead, re-evaluate queue!
                checkMovementRef.current();
            }, 6000);
        }
    };

    return (
        <group
            ref={robotRef}
            position={[0, initialY, 0]}
            scale={[initialScale, initialScale, initialScale]}
            rotation={[0, 0, 0]}
            onClick={handleClick}
        >
            <RobotModel
                ref={robotModelRef}
                modelPath="/models/quaternius_cc0-george-1063.glb"
                initialAnimation="hello"
            />
        </group>
    );
}

export default function RobotScene3D() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    return (
        <div ref={sceneRef} className="robot-3d-container pointer-events-none fixed inset-0 z-50">
            <Canvas 
                shadows 
                gl={{ antialias: true, alpha: true }} 
                style={{ pointerEvents: 'none' }}
                eventSource={typeof document !== 'undefined' ? document.body : undefined} 
                eventPrefix="client"
            >
                <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 6]} fov={45} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <ResponsiveRobot />

                    <ContactShadows
                        position={[0, -1.5, 0]}
                        opacity={0.4}
                        scale={10}
                        blur={2.5}
                        far={4}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
}
