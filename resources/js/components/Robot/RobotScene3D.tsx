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
    // click animation finishes.
    const currentAnimRef = useRef<string>('idle');
    const isDeadRef = useRef<boolean>(false);

    // Dynamic initial values based on viewport size.
    // A standard desktop has viewport.width ~ 10-15. Mobile is often ~ 4-6.
    const isMobile = viewport.width < 8;
    
    // Scale down slightly on mobile so it doesn't overwhelm the screen
    const initialScale = isMobile ? 0.16 : 0.27; 
    const initialY = isMobile ? -0.5 : -1.0;

    useEffect(() => {
        if (!robotRef.current) return;

        // Keep track of scroll triggers to clean them up
        const triggers: ScrollTrigger[] = [];

        // Start with 'hello' animation
        if (robotModelRef.current) {
            robotModelRef.current.playAnimation('hello');
        }

        const tl = gsap.timeline({
            delay: 3,
            onStart: () => {
                if (robotModelRef.current) {
                    robotModelRef.current.playAnimation('run');
                }
            },
            onComplete: () => {
                let insideAnySection = false;

                // After initial sequence, set up scroll-based triggers for the sections below
                const sections = [
                    { id: '#robot-section-2', anim: 'jump' },   // Phase 1
                    { id: '#robot-section-3', anim: 'dance' },  // Phase 2
                    { id: '#robot-section-4', anim: 'punch' },  // Phase 3
                ];

                sections.forEach(({ id, anim }) => {
                    const st = ScrollTrigger.create({
                        trigger: id,
                        start: "top 50%",    // Triggers when the top of the section hits the vertital center of the screen (50% visible)
                        end: "bottom 50%",   // Ends when the bottom of the section hits the vertical center of the screen (drops below 50% visible)
                        onEnter: () => {
                            currentAnimRef.current = anim;
                            if (!isDeadRef.current) robotModelRef.current?.playAnimation(anim);
                        },
                        onEnterBack: () => {
                            currentAnimRef.current = anim;
                            if (!isDeadRef.current) robotModelRef.current?.playAnimation(anim);
                        },
                        onLeave: () => {
                            currentAnimRef.current = 'idle';
                            if (!isDeadRef.current) robotModelRef.current?.playAnimation('idle');
                        },
                        onLeaveBack: () => {
                            currentAnimRef.current = 'idle';
                            if (!isDeadRef.current) robotModelRef.current?.playAnimation('idle');
                        },
                    });
                    
                    // If the user's scroll position is already inside one of these sections
                    // when the intro finishes, st.isActive will be true.
                    if (st.isActive) {
                        insideAnySection = true;
                    }
                    
                    triggers.push(st);
                });

                // Default to idle if the user is on the Hero section (no active triggers)
                if (!insideAnySection) {
                    currentAnimRef.current = 'idle';
                    if (!isDeadRef.current && robotModelRef.current) {
                        robotModelRef.current.playAnimation('idle');
                    }
                }
            }
        });

        // Dynamically calculate the bottom-left corner using viewport percentages.
        // -viewport.width / 2 is the exact left edge of the screen.
        // We multiply by 0.85 to add a neat 15% padding from the edge.
        const paddingX = isMobile ? 0.80 : 0.85; 
        const paddingY = isMobile ? 0.80 : 0.85;
        
        const targetX = -(viewport.width / 2) * paddingX;
        const targetY = -(viewport.height / 2) * paddingY;
        const targetScale = isMobile ? 0.08 : 0.16;

        // Move to bottom-left corner over 2 seconds
        tl.to(robotRef.current.position, { x: targetX, y: targetY, z: 0, duration: 2, ease: "power2.inOut" }, 0);
        tl.to(robotRef.current.scale,    { x: targetScale, y: targetScale, z: targetScale, duration: 2, ease: "power2.inOut" }, 0);
        tl.to(robotRef.current.rotation, { y: Math.PI / 8, duration: 2, ease: "power2.inOut" }, 0);

        return () => {
            tl.kill(); 
            triggers.forEach(t => t.kill());
        };
    }, [viewport.width, viewport.height, isMobile]);

    const handleClick = (e: any) => {
        e.stopPropagation(); // Avoid triggering underneath if possible
        if (robotModelRef.current && !isDeadRef.current) {
            isDeadRef.current = true;
            robotModelRef.current.playAnimation('death');
            
            // Wait 6 seconds so it stays dead longer, then return to whatever animation is intended for the current scroll position
            setTimeout(() => {
                isDeadRef.current = false;
                if (robotModelRef.current) {
                    robotModelRef.current.playAnimation(currentAnimRef.current);
                }
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
            onPointerOver={() => { if (typeof document !== 'undefined') document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { if (typeof document !== 'undefined') document.body.style.cursor = 'auto'; }}
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
