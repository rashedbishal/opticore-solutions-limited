import { useContext } from 'react';
import { LenisContext } from '@/components/Layout/SmoothScroll';

export function useLenis() {
    return useContext(LenisContext);
}
