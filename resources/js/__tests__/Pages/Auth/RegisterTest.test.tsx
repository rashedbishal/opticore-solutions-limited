import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from '@/pages/Auth/Register';

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

vi.mock('@/components/Layout/GuestLayout', () => ({
    default: ({ children }: { children?: React.ReactNode }) => (
        <>{children}</>
    ),
}));

describe('Register', () => {
    it('renders without crashing', () => {
        render(<Register />);

        expect(
            screen.getByRole('heading', { name: /start your journey/i }),
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Full Name')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Email Address'),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Create Password'),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<Register />);

        const nameInput = screen.getByPlaceholderText('Full Name');
        const emailInput = screen.getByPlaceholderText('Email Address');
        const passwordInput = screen.getByPlaceholderText('Create Password');
        const confirmInput = screen.getByPlaceholderText('Confirm Password');

        await user.type(nameInput, 'Jane Doe');
        await user.type(emailInput, 'jane@example.com');
        await user.type(passwordInput, 'super-secret');
        await user.type(confirmInput, 'super-secret');

        expect(nameInput).toHaveValue('Jane Doe');
        expect(emailInput).toHaveValue('jane@example.com');
        expect(passwordInput).toHaveValue('super-secret');
        expect(confirmInput).toHaveValue('super-secret');
    });

    it('shows validation error messages when submitting an empty form', () => {
        const { container } = render(<Register />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            screen.getByText('The name field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The email field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The password field is required.'),
        ).toBeInTheDocument();
    });
});
