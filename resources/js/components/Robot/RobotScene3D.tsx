import { Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
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
// A fully responsive wrapper for the robot.
// By being inside the <Canvas>, it can use useThree() to get exact viewport dimensions.
function ResponsiveRobot() {
    const { viewport } = useThree();
    const robotRef = useRef<THREE.Group>(null);
    const robotModelRef = useRef<RobotModelRef>(null);

    // Dynamic initial values based on viewport size.
    // A standard desktop has viewport.width ~ 10-15. Mobile is often ~ 4-6.
    const isMobile = viewport.width < 8;
    
    // Scale down slightly on mobile so it doesn't overwhelm the screen
    const initialScale = isMobile ? 0.16 : 0.27; 
    const initialY = isMobile ? -0.5 : -1.0;

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
            tl.kill(); // clean up animation if component unmounts
        };
    }, [viewport.width, viewport.height, isMobile]);

    return (
        <group
            ref={robotRef}
            position={[0, initialY, 0]}
            scale={[initialScale, initialScale, initialScale]}
            rotation={[0, 0, 0]}
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
            <Canvas shadows gl={{ antialias: true, alpha: true }} style={{ pointerEvents: 'none' }}>
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
