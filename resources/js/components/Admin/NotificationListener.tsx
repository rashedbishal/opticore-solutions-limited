import { useEcho } from '@laravel/echo-react';
import { useCallback } from 'react';

interface Props {
    isOnChatPage: boolean;
    onNewMessage: () => void;
}

export default function NotificationListener({
    isOnChatPage,
    onNewMessage,
}: Props) {
    useEcho(
        'admin.conversations',
        'MessageSent',
        useCallback(
            (e: any) => {
                const msg = e.message;

                if (msg.sender_type === 'user' && !isOnChatPage) {
                    onNewMessage();
                }
            },
            [isOnChatPage, onNewMessage],
        ),
    );

    return null;
}
