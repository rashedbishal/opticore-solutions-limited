import { render, screen } from '@testing-library/react';
import TaskIndex from '@/pages/Admin/Task/Index';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } = await import(
        '../../../helpers/inertiaMocks'
    );

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
        },
    ],
    links: [],
};

const emptyTasks = { data: [], links: [] };

describe('Admin Task Index', () => {
    it('renders without crashing', () => {
        render(<TaskIndex tasks={tasks} />);

        expect(
            screen.getByRole('heading', { name: 'Client Workflow Management' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
        expect(screen.getByText('Brand refresh')).toBeInTheDocument();
    });

    it('displays the correct status option selected for each task state', () => {
        render(<TaskIndex tasks={tasks} />);

        const statusSelects = screen.getAllByRole('combobox');

        expect(statusSelects).toHaveLength(3);
        expect(statusSelects[0]).toHaveValue('pending');
        expect(statusSelects[1]).toHaveValue('in progress');
        expect(statusSelects[2]).toHaveValue('delivered');
    });

    it('shows an empty state message when there are no tasks', () => {
        render(<TaskIndex tasks={emptyTasks} />);

        expect(screen.getByText('No tasks found')).toBeInTheDocument();
    });
});
