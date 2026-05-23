import { useEcho } from '@laravel/echo-react';

interface Props {
    isOnChatPage: boolean;
    onNewMessage: (senderName?: string) => void;
}

export default function NotificationListener({
    isOnChatPage,
    onNewMessage,
}: Props) {
    useEcho(
        'admin.conversations',
        'MessageSent',
        (e: any) => {
            const msg = e.message;

            if (msg?.sender_type === 'user' && !isOnChatPage) {
                const name: string | undefined =
                    msg.conversation?.user?.name ??
                    e?.user?.name ??
                    undefined;
                onNewMessage(name);
            }
        },
        [isOnChatPage, onNewMessage],
    );

    return null;
}
