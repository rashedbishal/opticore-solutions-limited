import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import { useRef } from 'react';
import useEchoReady from '@/hooks/useEchoReady';

/**
 * Refreshes the lead list/board (and an open panel) when any lead arrives or
 * changes. The broadcast carries only an id; the reload goes back through
 * the server, so each viewer still only sees what they're allowed to.
 */
export default function LeadsLiveRefresh({
    only = ['leads', 'selectedLead'],
}: {
    only?: string[];
}) {
    const echoReady = useEchoReady();

    return echoReady ? <Listener only={only} /> : null;
}

function Listener({ only }: { only: string[] }) {
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEcho('admin.leads', ['.lead.received', '.lead.updated'], () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }

        // Several changes in a burst become one reload.
        timer.current = setTimeout(() => {
            router.reload({ only });
        }, 400);
    });

    return null;
}
