import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TestimonialEdit from '@/pages/Admin/Testimonial/Edit';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } = await import(
        '../../../helpers/inertiaMocks'
    );

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

const testimonial = {
    id: 1,
    name: 'Alex Rivera',
    company: 'TechFlow',
    role: 'CEO',
    rating: 5,
    comment: 'Outstanding work on our rebrand.',
    sort_order: 0,
    is_active: true,
    image_url: null,
};

const emptyTestimonial = {
    ...testimonial,
    name: '',
    company: '',
    role: '',
    comment: '',
};

describe('Admin Testimonial Edit', () => {
    it('renders without crashing', () => {
        render(<TestimonialEdit testimonial={testimonial} />);

        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Alex Rivera')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /update testimonial/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<TestimonialEdit testimonial={testimonial} />);

        const nameInput = screen.getByDisplayValue('Alex Rivera');

        await user.clear(nameInput);
        await user.type(nameInput, 'Alexandra Rivera');

        expect(nameInput).toHaveValue('Alexandra Rivera');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(
            <TestimonialEdit testimonial={emptyTestimonial} />,
        );

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
