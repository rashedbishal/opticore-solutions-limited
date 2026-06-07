import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestimonialCreate from '@/pages/Admin/Testimonial/Create';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

describe('Admin Testimonial Create', () => {
    it('renders without crashing', () => {
        render(<TestimonialCreate />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('e.g. Alex Rivera'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /save testimonial/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<TestimonialCreate />);

        const nameInput = screen.getByPlaceholderText('e.g. Alex Rivera');
        const companyInput = screen.getByPlaceholderText('e.g. TechFlow');
        const commentInput = screen.getByPlaceholderText(
            'What the client said...',
        );

        await user.type(nameInput, 'Alex Rivera');
        await user.type(companyInput, 'TechFlow Inc.');
        await user.type(commentInput, 'Outstanding work on our rebrand.');

        expect(nameInput).toHaveValue('Alex Rivera');
        expect(companyInput).toHaveValue('TechFlow Inc.');
        expect(commentInput).toHaveValue('Outstanding work on our rebrand.');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(<TestimonialCreate />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            await screen.findByText(/The name field is required\./),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/The comment field is required\./),
        ).toBeInTheDocument();
    });
});
