import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OfferShow from '@/pages/Offer/Show';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock } = await import('../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        usePage: () => ({
            ...inertiaMock.usePage(),
            props: {
                ...inertiaMock.usePage().props,
                categories: {},
            },
        }),
    };
});

vi.mock('@/components/Layout/AppLayout', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

const postMock = vi.fn().mockResolvedValue({ data: {}, status: 200 });

vi.mock('@/lib/apiFetch', () => ({
    api: {
        post: (...args: unknown[]) => postMock(...args),
    },
}));

function buildOffer(overrides: Partial<Record<string, unknown>> = {}) {
    return {
        id: 1,
        conversation_id: 10,
        category_slug: 'graphic-design',
        payment_type: 'single' as const,
        description: 'A custom logo package.',
        request_requirements: false,
        price: '75.00',
        delivery_days: 5,
        revisions: 2,
        expires_at: null,
        status: 'pending' as const,
        offer_token: 'test-token-123',
        sub_category: null,
        milestones: [],
        conversation: {
            user: { id: 5, name: 'Jane Client', email: 'jane@example.com' },
        },
        created_at: new Date().toISOString(),
        ...overrides,
    };
}

describe('Offer Show (client view)', () => {
    beforeEach(() => {
        postMock.mockClear();
    });

    it('renders offer details with Accept/Decline actions for a pending offer', () => {
        render(<OfferShow offer={buildOffer()} canRespond isAdmin={false} />);

        expect(screen.getByText('A custom logo package.')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /accept offer/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /decline/i }),
        ).toBeInTheDocument();
    });

    it('calls the accept endpoint when the client accepts the offer', async () => {
        const user = userEvent.setup();

        render(<OfferShow offer={buildOffer()} canRespond isAdmin={false} />);

        await user.click(screen.getByRole('button', { name: /accept offer/i }));

        await waitFor(() => {
            expect(postMock).toHaveBeenCalledWith(
                '/offer/test-token-123/accept',
            );
        });
    });

    it('calls the decline endpoint when the client declines the offer', async () => {
        const user = userEvent.setup();

        render(<OfferShow offer={buildOffer()} canRespond isAdmin={false} />);

        await user.click(screen.getByRole('button', { name: /decline/i }));

        await waitFor(() => {
            expect(postMock).toHaveBeenCalledWith(
                '/offer/test-token-123/decline',
            );
        });
    });

    it('does not show Accept/Decline actions once the offer has been accepted', () => {
        render(
            <OfferShow
                offer={buildOffer({ status: 'accepted' })}
                canRespond
                isAdmin={false}
            />,
        );

        expect(
            screen.queryByRole('button', { name: /accept offer/i }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /decline/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByText('Offer Accepted')).toBeInTheDocument();
    });
});
