import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioSubCategoryCreate from '@/pages/Admin/PortfolioSubCategory/Create';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown>) =>
            useFormMock(initialData),
    };
});

const categories = { branding: 'Branding' };

describe('Admin PortfolioSubCategory Create', () => {
    it('renders without crashing', () => {
        render(<PortfolioSubCategoryCreate categories={categories} />);

        expect(
            screen.getByRole('heading', { name: 'Create Sub-Category' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /create sub-category/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(<PortfolioSubCategoryCreate categories={categories} />);

        const nameInput = screen.getByPlaceholderText('e.g. Logo & Identity');
        const slugInput = screen.getByPlaceholderText('e.g. logo-identity');
        const priceInput = screen.getByPlaceholderText('e.g. 500 BDT');

        await user.type(nameInput, 'Logo & Identity');
        await user.type(slugInput, 'logo-identity');
        await user.type(priceInput, '500 BDT');

        expect(nameInput).toHaveValue('Logo & Identity');
        expect(slugInput).toHaveValue('logo-identity');
        expect(priceInput).toHaveValue('500 BDT');
    });

    it('shows validation error messages when submitting an empty form', async () => {
        const { container } = render(
            <PortfolioSubCategoryCreate categories={{}} />,
        );

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            await screen.findByText(/Please select a parent category\./),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Sub-category name is required\./),
        ).toBeInTheDocument();
    });
});
