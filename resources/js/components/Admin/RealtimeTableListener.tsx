import { router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

interface Props {
    channel: string;
    event: string;
    only: string[];
}

export default function RealtimeTableListener({ channel, event, only }: Props) {
    useEcho(
        channel,
        event,
        () => {
            router.reload({ only });
        },
        [only],
    );

    return null;
}
