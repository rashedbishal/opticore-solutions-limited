import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogCreate from '@/pages/Admin/Blog/Create';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

describe('Admin Blog Create', () => {
    it('renders without crashing', () => {
        render(<BlogCreate />);

        expect(screen.getByText('Post Title')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('Enter an engaging title...'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /save post/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<BlogCreate />);

        const titleInput = screen.getByPlaceholderText(
            'Enter an engaging title...',
        );
        const excerptInput = screen.getByPlaceholderText(
            'Brief summary of the article...',
        );
        const authorInput = screen.getByPlaceholderText('e.g., John Doe');

        await user.type(titleInput, 'My First Post');
        await user.type(excerptInput, 'A short summary');
        await user.type(authorInput, 'Jane Doe');

        expect(titleInput).toHaveValue('My First Post');
        expect(excerptInput).toHaveValue('A short summary');
        expect(authorInput).toHaveValue('Jane Doe');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(<BlogCreate />);

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            await screen.findByText(/Post title is required\./),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Post content is required\./),
        ).toBeInTheDocument();
    });
});
