import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupportWidget from '@/components/chat/SupportWidget';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock } = await import('../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        usePage: () => ({
            ...inertiaMock.usePage(),
            props: {
                ...inertiaMock.usePage().props,
                auth: {
                    user: {
                        id: 7,
                        name: 'Jane Client',
                        email: 'jane@example.com',
                    },
                },
            },
        }),
    };
});

vi.mock('@laravel/echo-react', () => ({
    echo: () => ({
        private: () => ({
            whisper: () => {},
            listen: () => {},
            stopListening: () => {},
        }),
    }),
    useEcho: () => {},
}));

const conversation = { id: 42, user_id: 7 };

function postResponse(url: string) {
    if (url === '/user-chat/init') {
        return Promise.resolve({
            data: { conversation, unread_count: 0 },
            status: 200,
        });
    }

    if (url.endsWith('/message')) {
        return Promise.resolve({
            data: {
                id: 99,
                sender_type: 'user',
                message: 'Hello, I need help with my order.',
                attachment_path: null,
                attachment_name: null,
                attachment_type: null,
                offer_id: null,
                offer: null,
                delivered_at: null,
                read_at: null,
                created_at: new Date().toISOString(),
            },
            status: 200,
        });
    }

    return Promise.resolve({ data: {}, status: 200 });
}

const postMock = vi.fn<
    (url: string, ...rest: unknown[]) => ReturnType<typeof postResponse>
>((url) => postResponse(url));

const getMock = vi.fn<
    (
        url: string,
        ...rest: unknown[]
    ) => Promise<{ data: { data: never[] }; status: number }>
>(() => Promise.resolve({ data: { data: [] }, status: 200 }));

vi.mock('@/lib/apiFetch', () => ({
    api: {
        post: (...args: [string, ...unknown[]]) => postMock(...args),
        get: (...args: [string, ...unknown[]]) => getMock(...args),
    },
}));

describe('SupportWidget', () => {
    beforeEach(() => {
        postMock.mockClear();
        getMock.mockClear();
    });

    it('shows the closed toggle button with an "Open chat" label', () => {
        render(<SupportWidget isOpen={false} onOpenChange={() => {}} />);

        expect(
            screen.getByRole('button', { name: 'Open chat' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('Type a message...'),
        ).not.toBeInTheDocument();
    });

    it('initializes the conversation and shows the empty state when opened', async () => {
        render(<SupportWidget isOpen onOpenChange={() => {}} />);

        await waitFor(() => {
            expect(postMock).toHaveBeenCalledWith('/user-chat/init');
        });

        expect(
            await screen.findByText('Start a conversation'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: 'Close chat' }),
        ).toHaveLength(2);
    });

    it('sends a typed message and clears the input', async () => {
        const user = userEvent.setup();

        const { container } = render(
            <SupportWidget isOpen onOpenChange={() => {}} />,
        );

        const input = await screen.findByPlaceholderText('Type a message...');
        const submitButton = container.querySelector(
            'button[type="submit"]',
        ) as HTMLButtonElement;

        await user.type(input, 'Hello, I need help with my order.');
        await user.click(submitButton);

        await waitFor(() => {
            expect(postMock).toHaveBeenCalledWith(
                '/user-chat/42/message',
                expect.any(FormData),
            );
        });
        expect(input).toHaveValue('');
    });
});
