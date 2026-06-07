import { fireEvent, render, screen } from '@testing-library/react';
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

async function openApplicationModal() {
    const user = userEvent.setup();
    render(<Career />);

    const applyButtons = screen.getAllByRole('button', {
        name: /apply for/i,
    });
    await user.click(applyButtons[0]);

    return user;
}

describe('Career', () => {
    it('renders without crashing', () => {
        render(<Career />);

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('Join Our Team')).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: /apply for/i }).length,
        ).toBeGreaterThan(0);
    });

    it('updates field values as the user types after opening the application modal', async () => {
        const user = await openApplicationModal();

        const nameInput = screen.getByLabelText('Name');
        const emailInput = screen.getByLabelText('Email');
        const phoneInput = screen.getByLabelText('Phone');
        const messageInput = screen.getByLabelText('Message');

        await user.type(nameInput, 'John Smith');
        await user.type(emailInput, 'john@example.com');
        await user.type(phoneInput, '01700000000');
        await user.type(messageInput, 'I would love to join the team.');

        expect(nameInput).toHaveValue('John Smith');
        expect(emailInput).toHaveValue('john@example.com');
        expect(phoneInput).toHaveValue('01700000000');
        expect(messageInput).toHaveValue('I would love to join the team.');
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
            screen.getByText('The message field is required.'),
        ).toBeInTheDocument();
    });
});
