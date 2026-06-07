import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequestAppointment from '@/pages/RequestAppointment';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } = await import(
        '../helpers/inertiaMocks'
    );

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

function getForm(container: HTMLElement) {
    const form = container.querySelector('form');
    expect(form).not.toBeNull();

    return form!;
}

describe('RequestAppointment', () => {
    it('renders without crashing', () => {
        render(<RequestAppointment />);

        expect(
            screen.getByRole('heading', { level: 1 }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    });

    it('updates field values as the user types in step one', async () => {
        const user = userEvent.setup();
        render(<RequestAppointment />);

        const nameInput = screen.getByLabelText('Full Name');
        const emailInput = screen.getByLabelText('Email');
        const phoneInput = screen.getByLabelText('Phone');

        await user.type(nameInput, 'Alex Rahman');
        await user.type(emailInput, 'alex@example.com');
        await user.type(phoneInput, '01800000000');

        expect(nameInput).toHaveValue('Alex Rahman');
        expect(emailInput).toHaveValue('alex@example.com');
        expect(phoneInput).toHaveValue('01800000000');
    });

    it('shows validation error messages when submitting an empty form on the final step', async () => {
        const { container } = render(<RequestAppointment />);

        const form = getForm(container);

        // Step 1 -> Step 2 (no validation blocks the step transition)
        fireEvent.submit(form);

        expect(await screen.findByLabelText('Service')).toBeInTheDocument();

        // Step 2 -> triggers form.post with empty data
        fireEvent.submit(getForm(container));

        expect(
            await screen.findByText('The service field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The preferred date field is required.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText('The message field is required.'),
        ).toBeInTheDocument();
    });
});
