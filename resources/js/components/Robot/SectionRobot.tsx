import {
    Environment,
    ContactShadows,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { gsap } from 'gsap';
import React, { useRef, useEffect, useState, Suspense } from 'react';
import type * as THREE from 'three';
import RobotModel from './RobotModel';
import type { RobotModelRef } from './RobotModel';

interface SectionRobotProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    animation?: string;
    className?: string;
}

export default function SectionRobot({
    position = 'bottom-right',
    animation,
    className = '',
}: SectionRobotProps) {
    const robotModelRef = useRef<RobotModelRef>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    const [selectedAnimation, setSelectedAnimation] = useState(animation || 'idle');

    useEffect(() => {
        if (!animation) {
            const animations = ['idle', 'dance', 'punch', 'jump'];
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedAnimation(animations[Math.floor(Math.random() * animations.length)]);
        }
    }, [animation]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 },
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const getPositionClasses = () => {
        switch (position) {
            case 'top-left':
                return 'top-4 left-4';
            case 'top-right':
                return 'top-4 right-4';
            case 'bottom-left':
                return 'bottom-4 left-4';
            case 'bottom-right':
                return 'bottom-4 right-4';
            default:
                return 'bottom-4 right-4';
        }
    };

    return (
        <div
            ref={containerRef}
            className={`absolute ${getPositionClasses()} pointer-events-none z-20 h-48 w-48 ${className}`}
            style={{ minHeight: '150px' }}
        >
            {isVisible && (
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

                        <RobotInScene
                            animation={selectedAnimation}
                            ref={robotModelRef}
                        />

                        <ContactShadows
                            position={[0, -1.2, 0]}
                            opacity={0.4}
                            scale={5}
                            blur={2}
                            far={3}
                        />
                    </Suspense>
                </Canvas>
            )}
        </div>
    );
}

const RobotInScene = React.forwardRef<RobotModelRef, { animation: string }>(
    ({ animation }, ref) => {
        const groupRef = useRef<THREE.Group>(null);

        useEffect(() => {
            if (!groupRef.current) {
return;
}

            // Add some random subtle movement or spinning if requested
            if (animation === 'spin') {
                gsap.to(groupRef.current.rotation, {
                    y: Math.PI * 2,
                    duration: 4,
                    repeat: -1,
                    ease: 'none',
                });
            } else if (animation === 'circle') {
                // Simple "walking in circles" motion via position animation
                const tl = gsap.timeline({ repeat: -1 });
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
                        animation === 'spin' || animation === 'circle'
                            ? 'idle'
                            : animation
                    }
                />
            </group>
        );
    },
);
