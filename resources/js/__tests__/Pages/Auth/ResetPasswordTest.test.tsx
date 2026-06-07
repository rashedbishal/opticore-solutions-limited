import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPassword from '@/pages/Auth/ResetPassword';

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

describe('ResetPassword', () => {
    it('renders without crashing', () => {
        render(<ResetPassword token="reset-token" email="" />);

        expect(
            screen.getByRole('heading', { name: /new credentials/i }),
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New Password')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Confirm New Password'),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<ResetPassword token="reset-token" email="" />);

        const emailInput = screen.getByPlaceholderText('Email Address');
        const passwordInput = screen.getByPlaceholderText('New Password');
        const confirmInput = screen.getByPlaceholderText(
            'Confirm New Password',
        );

        await user.type(emailInput, 'jane@example.com');
        await user.type(passwordInput, 'new-secret');
        await user.type(confirmInput, 'new-secret');

        expect(emailInput).toHaveValue('jane@example.com');
        expect(passwordInput).toHaveValue('new-secret');
        expect(confirmInput).toHaveValue('new-secret');
    });

    it('shows validation error messages when submitting an empty form', () => {
        const { container } = render(
            <ResetPassword token="reset-token" email="" />,
        );

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            screen.getByText('The email field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The password field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The password confirmation field is required.'),
        ).toBeInTheDocument();
    });
});
