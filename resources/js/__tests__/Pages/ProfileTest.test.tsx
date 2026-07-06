import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Profile from '@/pages/Profile';

const paymentSuccess = {
    invoice_number: 'INV-0001',
    amount: '150.00',
    currency: 'USD',
    tran_id: 'txn-stale-flash-test',
};

const emptyPage = {
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 4,
};

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown> = {}) =>
            useFormMock(initialData),
        usePage: () => ({
            ...inertiaMock.usePage(),
            props: {
                ...inertiaMock.usePage().props,
                auth: {
                    user: {
                        id: 1,
                        name: 'Jamie Client',
                        email: 'jamie@example.com',
                    },
                },
                flash: { payment_success: paymentSuccess },
                tasks: emptyPage,
                orders: emptyPage,
                pendingOrders: [],
                notifyOrderUpdates: true,
                notifySecurityAlerts: true,
                notifyPromotionalEmails: false,
                isSocialAccount: false,
            },
        }),
    };
});

describe('Profile payment success modal', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('shows the payment success modal on first render', () => {
        render(<Profile />);

        expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    });

    it('records the dismissal in sessionStorage so a stale flash prop cannot reopen the modal after a remount', async () => {
        const user = userEvent.setup();
        const { unmount } = render(<Profile />);

        await user.click(screen.getByRole('button', { name: 'Done' }));

        expect(
            sessionStorage.getItem(
                `payment-success-dismissed:${paymentSuccess.tran_id}`,
            ),
        ).toBe('1');

        unmount();

        // Simulates the actual bug report: the Workflow/Orders tabs paginate
        // via partial Inertia reloads that never refresh `flash`, so
        // `flash.payment_success` is still truthy on any subsequent remount.
        render(<Profile />);

        expect(
            screen.queryByText('Payment Successful'),
        ).not.toBeInTheDocument();
    });
});
