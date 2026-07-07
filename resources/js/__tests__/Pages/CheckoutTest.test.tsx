import type { User } from '@/types/auth';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkout from '@/pages/Checkout';

const completeUser: User = {
    id: 1,
    name: 'Jane Client',
    email: 'jane@example.com',
    phone_number: '+8801712345678',
    address: '93 B, New Eskaton Road, Dhaka',
    country: 'Bangladesh',
    email_verified_at: null,
    created_at: '',
    updated_at: '',
};

const incompleteUser: User = {
    ...completeUser,
    address: null,
    country: null,
};

let currentUser: User | null = completeUser;

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock } = await import('../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        usePage: () => ({
            ...inertiaMock.usePage(),
            props: {
                ...inertiaMock.usePage().props,
                auth: { user: currentUser },
            },
        }),
    };
});

const item = {
    service: 'Logo Design',
    plan: 'Standard',
    price: '$50',
    delivery: '4 Days',
    category: 'graphic-design',
    subcategory: 'Logo Design',
    subcategory_id: 1,
};

function jsonResponse(body: unknown) {
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(body),
    } as Response);
}

describe('Checkout', () => {
    beforeEach(() => {
        currentUser = completeUser;

        vi.stubGlobal(
            'fetch',
            vi.fn((url: string) => {
                if (url.includes('/checkout/exchange-rate')) {
                    return jsonResponse({ rate: 120 });
                }

                if (url.includes('/gpay/config')) {
                    return jsonResponse({ available: false });
                }

                return jsonResponse({});
            }),
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document
            .querySelectorAll('script')
            .forEach((script) => script.remove());
    });

    it('shows the missing profile fields modal instead of paying when the profile is incomplete', async () => {
        currentUser = incompleteUser;
        const user = userEvent.setup();

        render(
            <Checkout
                item={item}
                sslEmbedScriptUrl="https://sandbox.sslcommerz.com/embed.min.js"
            />,
        );

        await user.click(screen.getByRole('button', { name: /pay now/i }));

        expect(
            screen.getByText('Complete Your Profile First'),
        ).toBeInTheDocument();
        expect(screen.getByText('Address')).toBeInTheDocument();
        expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('loads the SSLCommerz embed script instead of showing the modal when the profile is complete', async () => {
        const user = userEvent.setup();

        render(
            <Checkout
                item={item}
                sslEmbedScriptUrl="https://sandbox.sslcommerz.com/embed.min.js"
            />,
        );

        await user.click(screen.getByRole('button', { name: /pay now/i }));

        expect(
            screen.queryByText('Complete Your Profile First'),
        ).not.toBeInTheDocument();

        await waitFor(() => {
            expect(
                document.querySelector('script[src*="embed.min.js"]'),
            ).not.toBeNull();
        });
    });

    it('updates the displayed price when switching currency to BDT using the fetched rate', async () => {
        const user = userEvent.setup();

        render(
            <Checkout
                item={item}
                sslEmbedScriptUrl="https://sandbox.sslcommerz.com/embed.min.js"
            />,
        );

        await user.click(screen.getByRole('button', { name: 'BDT' }));

        await waitFor(() => {
            expect(screen.getByText('৳6,000')).toBeInTheDocument();
        });
        expect(screen.getByText(/1 usd = ৳120\.00/i)).toBeInTheDocument();
    });

    it('shows a file size error and blocks payment when total attachments exceed 300 MB', async () => {
        const user = userEvent.setup();

        const { container } = render(
            <Checkout
                item={item}
                sslEmbedScriptUrl="https://sandbox.sslcommerz.com/embed.min.js"
            />,
        );

        const fileInput = container.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;

        const bigFile = new File(['x'], 'huge-video.mp4', {
            type: 'video/mp4',
        });
        Object.defineProperty(bigFile, 'size', {
            value: 301 * 1024 * 1024,
        });

        await user.upload(fileInput, bigFile);

        expect(
            screen.getByText(/exceeds the 300 MB limit/i),
        ).toBeInTheDocument();

        const payButton = screen.getByRole('button', { name: /pay now/i });
        expect(payButton).toBeDisabled();
    });

    it('requires uploaded attachments to finish uploading before paying', async () => {
        const user = userEvent.setup();

        render(
            <Checkout
                item={item}
                sslEmbedScriptUrl="https://sandbox.sslcommerz.com/embed.min.js"
            />,
        );

        const fileInput = document.querySelector(
            'input[type="file"]',
        ) as HTMLInputElement;

        const smallFile = new File(['content'], 'brief.pdf', {
            type: 'application/pdf',
        });

        await user.upload(fileInput, smallFile);

        expect(
            within(document.body).getByText(/upload your files before paying/i),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pay now/i })).toBeDisabled();
    });
});
