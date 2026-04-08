import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import type { RobotModelRef } from './RobotModel';
import RobotModel from './RobotModel';

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

    // Initial values applied via JSX props on the group element.
    // These constants drive both the JSX defaults and the GSAP scroll animation.
    const INITIAL_SCALE = 0.27;
    const INITIAL_Y = -1.0;

    useEffect(() => {
        let raf: number;

        // Defer GSAP setup until after R3F has fully mounted the Three.js objects.
        raf = requestAnimationFrame(() => {
            if (!robotRef.current) {
                return;
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: ".robot-3d-trigger",
                    start: "top top",
                    end: "+=100%",
                    scrub: 1,
                    onUpdate: (self) => {
                        if (robotModelRef.current) {
                            if (self.progress > 0.3) {
                                robotModelRef.current.playAnimation('idle');
                            } else {
                                robotModelRef.current.playAnimation('hello');
                            }
                        }
                    }
                }
            });

            // Section 2: scroll-driven move to bottom-left corner
            tl.to(robotRef.current.position, { x: -3.8, y: -2.5, z: 0, duration: 1, ease: "power2.inOut" }, 0);
            tl.to(robotRef.current.scale,    { x: 0.12, y: 0.12, z: 0.12, duration: 1, ease: "power2.inOut" }, 0);
            tl.to(robotRef.current.rotation, { y: Math.PI / 6, duration: 1, ease: "power2.inOut" }, 0);
        });

        return () => {
            cancelAnimationFrame(raf);
            ScrollTrigger.getAll().forEach((t) => t.kill());
        };
    }, []);

    return (
        <div ref={sceneRef} className="robot-3d-container pointer-events-none fixed inset-0 z-50">
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 6]} fov={45} />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

                    <group
                        ref={robotRef}
                        position={[0, INITIAL_Y, 0]}
                        scale={[INITIAL_SCALE, INITIAL_SCALE, INITIAL_SCALE]}
                        rotation={[0, 0, 0]}
                    >
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
