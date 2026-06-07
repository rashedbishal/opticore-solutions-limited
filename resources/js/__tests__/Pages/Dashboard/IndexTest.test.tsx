import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDashboard from '@/pages/Dashboard/Index';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } = await import(
        '../../helpers/inertiaMocks'
    );

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

const pendingTask = {
    id: 1,
    task_name: 'Brand Refresh',
    category: 'graphic-design',
    sub_category: { id: 1, name: 'Logo Design', slug: 'logo-design' },
    date: '2026-06-01',
    state: 'pending' as const,
    can_review: false,
    has_review: false,
    review_eligible_until: null,
    service_url: null,
};

const reviewableTask = {
    id: 2,
    task_name: 'Landing Page Build',
    category: 'web-development',
    sub_category: null,
    date: '2026-06-02',
    state: 'delivered' as const,
    can_review: true,
    has_review: false,
    review_eligible_until: '2026-06-03',
    service_url: '/hire-us/web-development',
};

const reviewedTask = {
    id: 3,
    task_name: 'Promo Video Edit',
    category: 'video-editing',
    sub_category: null,
    date: '2026-05-20',
    state: 'delivered' as const,
    can_review: false,
    has_review: true,
    review_eligible_until: null,
    service_url: null,
};

const tasks = [pendingTask, reviewableTask, reviewedTask];

describe('Dashboard Index', () => {
    it('renders without crashing', () => {
        render(<UserDashboard tasks={tasks} />);

        expect(
            screen.getByRole('heading', { name: 'My Workspace' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Brand Refresh')).toBeInTheDocument();
        expect(screen.getByText('Landing Page Build')).toBeInTheDocument();
    });

    it('shows the review eligibility state for each task', async () => {
        const user = userEvent.setup();
        render(<UserDashboard tasks={tasks} />);

        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.getByText('Review Required')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /review now/i }),
        ).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Completed' }));

        expect(screen.getByText('Review submitted')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /review now/i }),
        ).not.toBeInTheDocument();
    });

    it('shows an empty state message when no tasks match the selected tab', async () => {
        const user = userEvent.setup();
        render(<UserDashboard tasks={[pendingTask]} />);

        await user.click(screen.getByRole('button', { name: 'Completed' }));

        expect(screen.getByText('No orders found')).toBeInTheDocument();
    });
});
