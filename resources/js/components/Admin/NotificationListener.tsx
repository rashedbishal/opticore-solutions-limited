import { useCallback, useRef } from 'react';
import { useEcho } from '@laravel/echo-react';

interface Props {
    isOnChatPage: boolean;
    onNewMessage: () => void;
}

export default function NotificationListener({ isOnChatPage, onNewMessage }: Props) {
    // Use refs so the stable callback below always sees the latest values
    const isOnChatPageRef = useRef(isOnChatPage);
    isOnChatPageRef.current = isOnChatPage;

    const onNewMessageRef = useRef(onNewMessage);
    onNewMessageRef.current = onNewMessage;

    useEcho(
        'admin.conversations',
        'MessageSent',
        useCallback((e: any) => {
            const msg = e.message;
            if (msg.sender_type === 'user' && !isOnChatPageRef.current) {
                onNewMessageRef.current();
            }
        }, []),
    );

    return null;
}
