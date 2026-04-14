import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import React, { useRef, useEffect } from 'react';
import type * as THREE from 'three';

interface RobotModelProps {
    modelPath: string;
    animationName?: string;
    [key: string]: any;
}

/**
 * RobotModel - Loads and animates the GLB model
 * Handles model positioning, scaling, and basic idle animation.
 */
export default function RobotModel({ modelPath, ...props }: RobotModelProps) {
    const group = useRef<THREE.Group>(null);
    const { scene, animations } = useGLTF(modelPath);
    const { actions } = useAnimations(animations, group);

    // Initial setup: Scale and center
    useEffect(() => {
        if (scene) {
            scene.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        }

        // Play the first available animation if any
        if (animations && animations.length > 0) {
            const firstAction = actions[Object.keys(actions)[0]];

            if (firstAction) {
                firstAction.fadeIn(0.5).play();
            }
        }
    }, [scene, animations, actions]);

    // Subtle idle floating if no specific animation is overriding
    useFrame((state) => {
        if (group.current) {
            const t = state.clock.getElapsedTime();
            group.current.position.y += Math.sin(t) * 0.002;
            group.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={scene} />
        </group>
    );
}

// Preload the model
useGLTF.preload('/models/pixellabs-glb-3347.glb');
