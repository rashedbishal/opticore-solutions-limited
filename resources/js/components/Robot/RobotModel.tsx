import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface RobotModelRef {
    playAnimation: (name: string) => void;
    getAvailableAnimations: () => string[];
}

interface RobotModelProps {
    modelPath: string;
    initialAnimation?: string;
    [key: string]: any;
}

/**
 * RobotModel - Loads and animates the GLB model
 * Handles model positioning, scaling, and animation playback.
 */
const RobotModel = forwardRef<RobotModelRef, RobotModelProps>(
    ({ modelPath, initialAnimation = 'hello', ...props }, ref) => {
        const group = useRef<THREE.Group>(null);
        const { scene, animations } = useGLTF(modelPath);
        const { actions } = useAnimations(animations, group);
        const currentActionRef = useRef<THREE.AnimationAction | null>(null);

        // Expose methods to parent via ref
        useImperativeHandle(ref, () => ({
            playAnimation: (name: string) => {
                if (!actions || Object.keys(actions).length === 0) return;

                // Find animation case-insensitively
                const animationNames = Object.keys(actions);
                const matchedName = animationNames.find(
                    (n) => n.toLowerCase() === name.toLowerCase()
                );

                if (matchedName && actions[matchedName]) {
                    const newAction = actions[matchedName];

                    // Stop current animation
                    if (currentActionRef.current) {
                        currentActionRef.current.fadeOut(0.5);
                    }

                    // Play new animation
                    newAction.reset().fadeIn(0.5).play();
                    currentActionRef.current = newAction;

                    console.log(`Playing animation: ${matchedName}`);
                } else {
                    console.warn(`Animation "${name}" not found. Available:`, animationNames);
                }
            },
            getAvailableAnimations: () => {
                return Object.keys(actions || {});
            },
        }));

        // Initial setup
        useEffect(() => {
            if (scene) {
                scene.traverse((child) => {
                    if ((child as THREE.Mesh).isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
            }

            // Log available animations
            if (animations && animations.length > 0) {
                console.log('Available animations:', animations.map((a) => a.name));
            }

            // Play initial animation
            if (initialAnimation && actions && Object.keys(actions).length > 0) {
                const animationNames = Object.keys(actions);
                const matchedName = animationNames.find(
                    (n) => n.toLowerCase() === initialAnimation.toLowerCase()
                );
                const actionToPlay = matchedName
                    ? actions[matchedName]
                    : actions[animationNames[0]];

                if (actionToPlay) {
                    actionToPlay.reset().fadeIn(0.5).play();
                    currentActionRef.current = actionToPlay;
                }
            }
        }, [scene, animations, actions, initialAnimation]);

        return (
            <group ref={group} {...props} dispose={null}>
                <primitive object={scene} />
            </group>
        );
    }
);

RobotModel.displayName = 'RobotModel';

export default RobotModel;

// Preload the model
useGLTF.preload('/models/quaternius_cc0-george-1063.glb');
