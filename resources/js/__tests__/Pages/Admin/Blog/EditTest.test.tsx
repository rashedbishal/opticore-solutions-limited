import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BlogEdit from '@/pages/Admin/Blog/Edit';

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

const blog = {
    id: 1,
    title: 'Existing Post',
    category: 'Graphic Design',
    excerpt: 'Existing excerpt',
    content: 'Existing content',
    author: 'Jane Doe',
    read_time: '5 min read',
    image: null,
};

const emptyBlog = {
    ...blog,
    title: '',
    content: '',
};

describe('Admin Blog Edit', () => {
    it('renders without crashing', () => {
        render(<BlogEdit blog={blog} />);

        expect(screen.getByText('Edit Blog Post')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Post')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /update blog/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<BlogEdit blog={blog} />);

        const titleInput = screen.getByDisplayValue('Existing Post');

        await user.clear(titleInput);
        await user.type(titleInput, 'Updated Title');

        expect(titleInput).toHaveValue('Updated Title');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(<BlogEdit blog={emptyBlog} />);

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
