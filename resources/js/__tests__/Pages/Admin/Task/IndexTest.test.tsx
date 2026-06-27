import { render, screen } from '@testing-library/react';
import TaskIndex from '@/pages/Admin/Task/Index';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown> = {}) =>
            useFormMock(initialData),
    };
});

const tasks = {
    data: [
        {
            id: 1,
            client_name: 'Alex Rivera',
            client_email: 'alex@example.com',
            category: 'graphic-design',
            sub_category: { id: 1, name: 'Logo Design' },
            task_name: 'Brand refresh',
            date: '2026-06-01',
            state: 'pending' as const,
            order_number: null,
        },
        {
            id: 2,
            client_name: 'Jordan Lee',
            client_email: 'jordan@example.com',
            category: 'web-development',
            sub_category: null,
            task_name: 'Landing page',
            date: '2026-06-03',
            state: 'in progress' as const,
            order_number: 'ORD-0002',
        },
        {
            id: 3,
            client_name: 'Sam Patel',
            client_email: 'sam@example.com',
            category: 'video-editing',
            sub_category: null,
            task_name: 'Promo video',
            date: '2026-06-05',
            state: 'delivered' as const,
            order_number: 'ORD-0003',
        },
    ],
    links: [],
};

const emptyTasks = { data: [], links: [] };

const defaultFilters = { search: '', state: '' };

describe('Admin Task Index', () => {
    it('renders without crashing', () => {
        render(<TaskIndex tasks={tasks} filters={defaultFilters} />);

        expect(
            screen.getByRole('heading', { name: 'Client Workflow Management' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
        expect(screen.getByText('Brand refresh')).toBeInTheDocument();
    });

    it('displays the correct status option selected for each task state', () => {
        render(<TaskIndex tasks={tasks} filters={defaultFilters} />);

        // The filter bar adds one state filter combobox before the per-row selects
        const statusSelects = screen.getAllByRole('combobox');

        expect(statusSelects).toHaveLength(4);
        // First combobox is the filter bar's state filter (empty = all states)
        expect(statusSelects[0]).toHaveValue('');
        expect(statusSelects[1]).toHaveValue('pending');
        expect(statusSelects[2]).toHaveValue('in progress');
        expect(statusSelects[3]).toHaveValue('delivered');
    });

    it('shows an empty state message when there are no tasks', () => {
        render(<TaskIndex tasks={emptyTasks} filters={defaultFilters} />);

        expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });
});
