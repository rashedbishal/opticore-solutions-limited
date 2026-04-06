import type Lenis from '@studio-freight/lenis';
import { useRef } from 'react';

export function useLenis() {
    return useRef<Lenis | null>(null);
}
