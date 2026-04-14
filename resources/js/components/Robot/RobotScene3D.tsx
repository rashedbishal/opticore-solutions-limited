import {
    Environment,
    PerspectiveCamera,
    ContactShadows,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import React, { useRef, useEffect, Suspense } from 'react';
import RobotModel from './RobotModel';

gsap.registerPlugin(ScrollTrigger);

/**
 * RobotScene3D - Main container for 3D robot motion graphics
 * Logic:
 * - Section 1: Center, scales up and floats
 * - Section 2: Moves to a corner (e.g., top-right)
 * - Section 3: Dances/jumps between corners
 */
export default function RobotScene3D() {
    const sceneRef = useRef<HTMLDivElement>(null);
    const robotRef = useRef<THREE.Group>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (!robotRef.current) {
return;
}

            // --- ANIMATION SEQUENCE ---

            // 1. Initial State (Section 1)
            // Starts in center, scales up
            gsap.set(robotRef.current.position, { x: 0, y: -0.5, z: 0 });
            gsap.set(robotRef.current.scale, { x: 0.8, y: 0.8, z: 0.8 });
            gsap.set(robotRef.current.rotation, { y: 0 });

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: '.robot-3d-trigger',
                    start: 'top top',
                    end: 'bottom bottom',
                    scrub: 1.2,
                },
            });

            // 2. Section 2: Move to corner
            // As user scrolls to Section 2, robot moves to side/corner
            tl.to(
                robotRef.current.position,
                {
                    x: 2.5,
                    y: 1.2,
                    z: -1,
                    duration: 1.5,
                    ease: 'power2.inOut',
                },
                'section2',
            );

            tl.to(
                robotRef.current.rotation,
                {
                    y: -Math.PI / 4,
                    duration: 1.5,
                    ease: 'power2.inOut',
                },
                'section2',
            );

            tl.to(
                robotRef.current.scale,
                {
                    x: 0.6,
                    y: 0.6,
                    z: 0.6,
                    duration: 1.5,
                },
                'section2',
            );

            // 3. Section 3: Dancing / Jumping Between Corners
            // Dynamic movement phase
            tl.addLabel('section3');

            // Move to opposite corner (bottom-left)
            tl.to(
                robotRef.current.position,
                {
                    x: -2.5,
                    y: -1.2,
                    z: 0.5,
                    duration: 2,
                    ease: 'bounce.out',
                },
                'section3',
            );

            tl.to(
                robotRef.current.rotation,
                {
                    y: Math.PI / 2,
                    z: 0.2,
                    duration: 1,
                },
                'section3',
            );

            // Jump to another position
            tl.to(
                robotRef.current.position,
                {
                    x: 0,
                    y: 2,
                    z: -2,
                    duration: 1,
                    ease: 'power3.out',
                },
                'section3+=2',
            );

            // Final Pose
            tl.to(
                robotRef.current.position,
                {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1,
                    ease: 'elastic.out(1, 0.5)',
                },
                'section3+=3',
            );

            tl.to(
                robotRef.current.rotation,
                {
                    y: Math.PI * 2,
                    duration: 2,
                },
                'section3+=3',
            );
        }, sceneRef);

        return () => ctx.revert();
    }, []);

    return (
        <div
            ref={sceneRef}
            className="robot-3d-container pointer-events-none fixed inset-0 z-50"
        >
            <Canvas shadows gl={{ antialias: true, alpha: true }}>
                <PerspectiveCamera
                    ref={cameraRef}
                    makeDefault
                    position={[0, 0, 5]}
                    fov={50}
                />

                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={1}
                        castShadow
                    />

                    <group ref={robotRef}>
                        <RobotModel modelPath="/models/pixellabs-glb-3347.glb" />
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
