import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPassword from '@/pages/Auth/ForgotPassword';

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

describe('ForgotPassword', () => {
    it('renders without crashing', () => {
        render(<ForgotPassword />);

        expect(
            screen.getByRole('heading', { name: /recover access/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Email Address'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /send reset link/i }),
        ).toBeInTheDocument();
    });

    it('updates field value as the user types', async () => {
        const user = userEvent.setup();
        render(<ForgotPassword />);

        const emailInput = screen.getByPlaceholderText('Email Address');

        await user.type(emailInput, 'jane@example.com');

        expect(emailInput).toHaveValue('jane@example.com');
    });

    it('shows a validation error message when submitting an empty form', () => {
        const { container } = render(<ForgotPassword />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            screen.getByText('The email field is required.'),
        ).toBeInTheDocument();
    });
});
