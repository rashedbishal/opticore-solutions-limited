import type { RobotModelRef } from './RobotModel';
import type * as THREE from 'three';
import { Environment, ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import React, { useRef, useEffect, Suspense } from 'react';
import RobotModel from './RobotModel';

interface SectionRobotCanvasProps {
    animation: string;
}

const RobotInScene = React.forwardRef<RobotModelRef, { animation: string }>(
    ({ animation }, ref) => {
        const groupRef = useRef<THREE.Group>(null);

        useEffect(() => {
            if (!groupRef.current) {
                return;
            }

            if (animation === 'spin') {
                gsap.to(groupRef.current.rotation, {
                    y: Math.PI * 2,
                    duration: 4,
                    repeat: -1,
                    ease: 'none',
                });
            } else if (animation === 'circle') {
                const tl = gsap.timeline({ repeat: -1 });
<<<<<<< HEAD
                tl.to(groupRef.current.position, { x: 0.5, z: 0.5, duration: 2, ease: 'sine.inOut' })
                    .to(groupRef.current.position, { x: 0, z: 1, duration: 2, ease: 'sine.inOut' })
                    .to(groupRef.current.position, { x: -0.5, z: 0.5, duration: 2, ease: 'sine.inOut' })
                    .to(groupRef.current.position, { x: 0, z: 0, duration: 2, ease: 'sine.inOut' });
=======
                tl.to(groupRef.current.position, {
                    x: 0.5,
                    z: 0.5,
                    duration: 2,
                    ease: 'sine.inOut',
                })
                    .to(groupRef.current.position, {
                        x: 0,
                        z: 1,
                        duration: 2,
                        ease: 'sine.inOut',
                    })
                    .to(groupRef.current.position, {
                        x: -0.5,
                        z: 0.5,
                        duration: 2,
                        ease: 'sine.inOut',
                    })
                    .to(groupRef.current.position, {
                        x: 0,
                        z: 0,
                        duration: 2,
                        ease: 'sine.inOut',
                    });
>>>>>>> @{-1}

                gsap.to(groupRef.current.rotation, {
                    y: Math.PI * 2,
                    duration: 8,
                    repeat: -1,
                    ease: 'none',
                });
            }
        }, [animation]);

        return (
            <group
                ref={groupRef}
                position={[0, -1, 0]}
                scale={[0.12, 0.12, 0.12]}
                rotation={[0, Math.PI / 8, 0]}
            >
                <RobotModel
                    ref={ref}
                    modelPath="/models/quaternius_cc0-george-1063.glb"
                    initialAnimation={
<<<<<<< HEAD
                        animation === 'spin' || animation === 'circle' ? 'idle' : animation
=======
                        animation === 'spin' || animation === 'circle'
                            ? 'idle'
                            : animation
>>>>>>> @{-1}
                    }
                />
            </group>
        );
    },
);

RobotInScene.displayName = 'RobotInScene';

<<<<<<< HEAD
export default function SectionRobotCanvas({ animation }: SectionRobotCanvasProps) {
=======
export default function SectionRobotCanvas({
    animation,
}: SectionRobotCanvasProps) {
>>>>>>> @{-1}
    const robotModelRef = useRef<RobotModelRef>(null);

    return (
        <Canvas
            shadows
            gl={{ antialias: true, alpha: true }}
            camera={{ position: [0, 0, 5], fov: 45 }}
        >
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
                <RobotInScene animation={animation} ref={robotModelRef} />
                <ContactShadows
                    position={[0, -1.2, 0]}
                    opacity={0.4}
                    scale={5}
                    blur={2}
                    far={3}
                />
            </Suspense>
        </Canvas>
    );
}
