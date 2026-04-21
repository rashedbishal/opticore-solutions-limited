import { useEffect, useState } from 'react';

declare global {
    interface Window {
        __echoConfigured?: boolean;
    }
}

export default function useEchoReady(): boolean {
    const [isReady, setIsReady] = useState(() => {
        if (typeof window === 'undefined') {
            return false;
        }

        return Boolean(window.__echoConfigured);
    });

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (window.__echoConfigured) {
            setIsReady(true);

            return;
        }

        const handleConfigured = () => setIsReady(true);

        window.addEventListener('echo:configured', handleConfigured);

        return () => {
            window.removeEventListener('echo:configured', handleConfigured);
        };
    }, []);

    return isReady;
}
