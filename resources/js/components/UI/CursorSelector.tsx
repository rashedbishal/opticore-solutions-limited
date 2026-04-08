"use client"

import { useEffect, useState } from 'react';
import RobotCursor from './RobotCursor';

export type CursorType = 'robot' | 'default';

const STORAGE_KEY = 'preferred-cursor';

export function useCursorPreference() {
    const [cursorType, setCursorType] = useState<CursorType>('robot');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as CursorType;
        if (stored && ['robot', 'default'].includes(stored)) {
            setCursorType(stored);
        }
        setIsLoaded(true);
    }, []);

    const setCursor = (type: CursorType) => {
        setCursorType(type);
        localStorage.setItem(STORAGE_KEY, type);
    };

    return { cursorType, setCursor, isLoaded };
}

interface CursorSelectorProps {
    cursorType: CursorType;
}

export default function CursorSelector({ cursorType }: CursorSelectorProps) {
    switch (cursorType) {
        case 'robot':
            return <RobotCursor />;
        case 'default':
        default:
            return null;
    }
}

// Quick switcher UI component (can be placed in settings or footer)
export function CursorSwitcher() {
    const { cursorType, setCursor, isLoaded } = useCursorPreference();

    if (!isLoaded) return null;

    const options: { value: CursorType; label: string; icon: string }[] = [
        { value: 'robot', label: 'Robot Cursor', icon: '🤖' },
        { value: 'default', label: 'Default', icon: '🖱️' },
    ];

    return (
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <span className="text-xs text-white/50">Cursor:</span>
            <div className="flex gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setCursor(option.value)}
                        className={`rounded-full p-1.5 text-xs transition-all ${
                            cursorType === option.value
                                ? 'bg-violet-500/60 text-white'
                                : 'text-white/40 hover:bg-white/10 hover:text-white/70'
                        }`}
                        title={option.label}
                    >
                        {option.icon}
                    </button>
                ))}
            </div>
        </div>
    );
}
