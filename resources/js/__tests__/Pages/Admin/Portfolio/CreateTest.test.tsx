import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioCreate from '@/pages/Admin/Portfolio/Create';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

const categories = { 'graphic-design': 'Graphic Design' };
const subCategoriesByCategory = { 'graphic-design': [] };

describe('Admin Portfolio Create', () => {
    it('renders without crashing', () => {
        render(
            <PortfolioCreate
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategory}
            />,
        );

        expect(screen.getByText('Create Portfolio')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /save portfolio/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(
            <PortfolioCreate
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategory}
            />,
        );

        const textInputs = screen.getAllByRole('textbox');
        const [titleInput, altInput] = textInputs;

        await user.type(titleInput, 'Brand Identity Shoot');
        await user.type(altInput, 'A photo of the new branding');

        expect(titleInput).toHaveValue('Brand Identity Shoot');
        expect(altInput).toHaveValue('A photo of the new branding');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(
            <PortfolioCreate
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategory}
            />,
        );

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            await screen.findByText(/Please select a sub-category\./),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/A media file \(image or video\) is required\./),
        ).toBeInTheDocument();
    });
});
