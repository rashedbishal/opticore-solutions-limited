import React, { useRef, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RobotModel, { RobotModelRef } from './RobotModel';

gsap.registerPlugin(ScrollTrigger);

/**
 * RobotScene3D - Main container for 3D robot motion graphics
 * Logic:
 * - Section 1: Center, plays hello animation
 * - Section 2: Moves to bottom left corner, plays idle animation, smaller size
 */
export default function RobotScene3D() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const robotRef = useRef<THREE.Group>(null);
    const robotModelRef = useRef<RobotModelRef>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (!robotRef.current) return;

            // --- ANIMATION SEQUENCE ---

            // 1. Initial State (Section 1 - Hero)
            // Centered, smaller size
            gsap.set(robotRef.current.position, { x: 0, y: -0.5, z: 0 });
            gsap.set(robotRef.current.scale, { x: 0.6, y: 0.6, z: 0.6 });
            gsap.set(robotRef.current.rotation, { y: 0 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".robot-3d-trigger",
                    start: "top top",
                    end: "+=100%",
                    scrub: 1,
                    onUpdate: (self) => {
                        // Switch animations based on scroll progress
                        if (robotModelRef.current) {
                            if (self.progress > 0.3) {
                                // Switch to idle animation when moving to corner
                                robotModelRef.current.playAnimation('idle');
                            } else {
                                // Play hello animation at start
                                robotModelRef.current.playAnimation('hello');
                            }
                        }
                    }
                }
            });

            // 2. Section 2: Move to bottom left corner
            // Decrease size further and move to corner
            tl.to(robotRef.current.position, {
                x: -3.5,
                y: -2,
                z: 0,
                duration: 1,
                ease: "power2.inOut"
            }, 0);

            tl.to(robotRef.current.scale, {
                x: 0.35,
                y: 0.35,
                z: 0.35,
                duration: 1,
                ease: "power2.inOut"
            }, 0);

            tl.to(robotRef.current.rotation, {
                y: Math.PI / 6,
                duration: 1,
                ease: "power2.inOut"
            }, 0);

        }, sceneRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={sceneRef} className="robot-3d-container pointer-events-none fixed inset-0 z-50">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 5]} fov={50} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <group ref={robotRef}>
                        <RobotModel
                            ref={robotModelRef}
                            modelPath="/models/quaternius_cc0-george-1063.glb"
                            initialAnimation="hello"
                        />
                    </group>

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
