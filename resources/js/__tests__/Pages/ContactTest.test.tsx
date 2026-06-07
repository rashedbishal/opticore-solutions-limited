import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Contact from '@/pages/Contact';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

describe('Contact', () => {
    it('renders without crashing', () => {
        render(<Contact />);

        expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
        expect(screen.getByText('Send a Message')).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<Contact />);

        const nameInput = screen.getByPlaceholderText('Your name');
        const emailInput = screen.getByPlaceholderText('your@email.com');
        const subjectInput = screen.getByPlaceholderText('How can we help?');
        const messageInput = screen.getByPlaceholderText(
            'Tell us about your project or inquiry...',
        );

        await user.type(nameInput, 'Jane Doe');
        await user.type(emailInput, 'jane@example.com');
        await user.type(subjectInput, 'Project inquiry');
        await user.type(messageInput, 'Hello, I would like to know more.');

        expect(nameInput).toHaveValue('Jane Doe');
        expect(emailInput).toHaveValue('jane@example.com');
        expect(subjectInput).toHaveValue('Project inquiry');
        expect(messageInput).toHaveValue('Hello, I would like to know more.');
    });

    it('shows validation error messages when submitting an empty form', () => {
        const { container } = render(<Contact />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(screen.getByText('Name is required.')).toBeInTheDocument();
        expect(
            screen.getByText(
                'Please enter a valid email address with a domain.',
            ),
        ).toBeInTheDocument();
        expect(screen.getByText('Subject is required.')).toBeInTheDocument();
        expect(screen.getByText('Message is required.')).toBeInTheDocument();
    });
});
