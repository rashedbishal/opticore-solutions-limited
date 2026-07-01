import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '@/pages/Auth/Login';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

vi.mock('@/components/Layout/GuestLayout', () => ({
    default: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

describe('Login', () => {
    it('renders without crashing', () => {
        render(<Login />);

        expect(
            screen.getByRole('heading', { name: /welcome/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Email Address'),
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /sign in/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('Email Address');
        const passwordInput = screen.getByPlaceholderText('Password');

        await user.type(emailInput, 'jane@example.com');
        await user.type(passwordInput, 'secret-password');

        expect(emailInput).toHaveValue('jane@example.com');
        expect(passwordInput).toHaveValue('secret-password');
    });

    it('shows validation error messages when submitting an empty form', () => {
        const { container } = render(<Login />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            screen.getByText('The email field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The password field is required.'),
        ).toBeInTheDocument();
    });
});
