import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Career from '@/pages/Career';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

vi.mock('@/components/UI/Modal', () => ({
    default: ({
        open,
        children,
    }: {
        open: boolean;
        title: string;
        onClose: () => void;
        children?: React.ReactNode;
    }) => (open ? <div role="dialog">{children}</div> : null),
}));

const careerPageProps = {
    jobListings: [
        {
            title: 'Web Developer',
            location: 'Remote',
            type: 'Full Time',
            description:
                'Ship high-quality digital experiences with strong frontend craft and dependable backend execution.',
        },
    ],
};

async function openApplicationModal() {
    const user = userEvent.setup();
    render(<Career {...careerPageProps} />);

    const applyButtons = screen.getAllByRole('button', {
        name: /apply for/i,
    });
    await user.click(applyButtons[0]);

    return user;
}

describe('Career', () => {
    it('renders without crashing', () => {
        render(<Career {...careerPageProps} />);

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('Join Our Team')).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: /apply for/i }).length,
        ).toBeGreaterThan(0);
    });

    it('updates field values as the user types after opening the application modal', async () => {
        const user = await openApplicationModal();

        await waitFor(() =>
            expect(screen.getByRole('dialog')).toBeInTheDocument(),
        );
        const dialog = screen.getByRole('dialog');

        const inputs = within(dialog).getAllByRole('textbox');
        const nameInput = inputs[0];
        const emailInput = inputs[2];
        const phoneInput = inputs[1];

        await user.type(nameInput, 'John Smith');
        await user.type(emailInput, 'john@example.com');
        await user.type(phoneInput, '01700000000');

        expect(nameInput).toHaveValue('John Smith');
        expect(emailInput).toHaveValue('john@example.com');
        expect(phoneInput).toHaveValue('01700000000');
    });

    it('shows validation error messages when submitting an empty application form', async () => {
        await openApplicationModal();

        const submitButton = screen.getByRole('button', {
            name: /submit career application/i,
        });
        const form = submitButton.closest('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            screen.getByText('The name field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The email field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The phone field is required.'),
        ).toBeInTheDocument();
    });
});
