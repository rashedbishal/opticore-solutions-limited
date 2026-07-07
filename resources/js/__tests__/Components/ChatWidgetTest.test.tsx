import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatWidget from '@/components/UI/ChatWidget';

function jsonResponse(body: unknown, ok = true) {
    return Promise.resolve({
        ok,
        json: () => Promise.resolve(body),
    } as Response);
}

describe('ChatWidget', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders the welcome message and suggested questions when open', () => {
        render(<ChatWidget isOpen onOpenChange={() => {}} />);

        expect(
            screen.getByText(/i'm your opticore ai assistant/i),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: /what services do you offer\?/i,
            }),
        ).toBeInTheDocument();
    });

    it('renders nothing chat-related when closed', () => {
        render(<ChatWidget isOpen={false} onOpenChange={() => {}} />);

        expect(
            screen.queryByPlaceholderText('Type your message...'),
        ).not.toBeInTheDocument();
    });

    it('sends a suggested question and displays the assistant reply', async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                jsonResponse({
                    reply: 'We offer graphic design, video editing, and more.',
                    session_id: 'session-123',
                }),
            ),
        );

        render(<ChatWidget isOpen onOpenChange={() => {}} />);

        await user.click(
            screen.getByRole('button', {
                name: /what services do you offer\?/i,
            }),
        );

        expect(
            await screen.findByText(
                'We offer graphic design, video editing, and more.',
            ),
        ).toBeInTheDocument();

        expect(fetch).toHaveBeenCalledWith(
            '/chat',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    message: 'What services do you offer?',
                    session_id: '',
                }),
            }),
        );
    });

    it('disables the send button until there is text, and sends on Enter', async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => jsonResponse({ reply: 'Sure, happy to help!' })),
        );

        const { container } = render(
            <ChatWidget isOpen onOpenChange={() => {}} />,
        );

        const input = screen.getByPlaceholderText('Type your message...');
        const sendIcons = container.querySelectorAll('svg.lucide-send');
        const sendButton = sendIcons[sendIcons.length - 1].closest(
            'button',
        ) as HTMLButtonElement;

        expect(sendButton).toBeDisabled();

        await user.type(input, 'How much does a logo cost?');
        expect(sendButton).toBeEnabled();

        await user.keyboard('{Enter}');

        expect(
            await screen.findByText('Sure, happy to help!'),
        ).toBeInTheDocument();
        expect(input).toHaveValue('');
    });

    it('shows a fallback message when the chat request fails', async () => {
        const user = userEvent.setup();
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network down'))),
        );

        render(<ChatWidget isOpen onOpenChange={() => {}} />);

        const input = screen.getByPlaceholderText('Type your message...');
        await user.type(input, 'Are you online?');
        await user.keyboard('{Enter}');

        await waitFor(() => {
            expect(
                screen.getByText(/trouble connecting right now/i),
            ).toBeInTheDocument();
        });
    });
});
