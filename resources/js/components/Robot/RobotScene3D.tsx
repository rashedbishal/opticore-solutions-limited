import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import React, { useRef, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import type { RobotModelRef } from './RobotModel';
import RobotModel from './RobotModel';

/**
 * RobotScene3D - Main container for 3D robot motion graphics
 * Logic:
 * - Section 1: Center, plays hello animation
 * - Section 2: Moves to bottom left corner, plays idle animation, smaller size
 */
// Extracts GSAP control into a child component that lives inside <Suspense>
// This guarantees the effect only runs AFTER the model asset has fully loaded
// and robotRef is populated.
function AnimationController({ 
    robotRef, 
    robotModelRef 
}: { 
    robotRef: React.RefObject<THREE.Group | null>; 
    robotModelRef: React.RefObject<RobotModelRef | null>;
}) {
    useEffect(() => {
        if (!robotRef.current) return;

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
                if (robotModelRef.current) {
                    robotModelRef.current.playAnimation('idle');
                }
            }
        });

        // Move to bottom-left corner over 2 seconds
        tl.to(robotRef.current.position, { x: -3.8, y: -2.5, z: 0, duration: 2, ease: "power2.inOut" }, 0);
        // Slightly smaller scale for the corner
        tl.to(robotRef.current.scale,    { x: 0.16, y: 0.16, z: 0.16, duration: 2, ease: "power2.inOut" }, 0);
        tl.to(robotRef.current.rotation, { y: Math.PI / 8, duration: 2, ease: "power2.inOut" }, 0);

        return () => {
            tl.kill(); // clean up animation if component unmounts
        };
    }, [robotRef, robotModelRef]);

    return null;
}

export default function RobotScene3D() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const robotRef = useRef<THREE.Group>(null);
    const robotModelRef = useRef<RobotModelRef>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    // Initial values applied via JSX props on the group element.
    // These constants drive both the JSX defaults and the GSAP scroll animation.
    const INITIAL_SCALE = 0.27;
    const INITIAL_Y = -1.0;

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

                    <AnimationController 
                        robotRef={robotRef} 
                        robotModelRef={robotModelRef} 
                    />

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
