import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioSubCategoryEdit from '@/pages/Admin/PortfolioSubCategory/Edit';

vi.mock('@inertiajs/react', async () => {
    const { inertiaMock, useFormMock } =
        await import('../../../helpers/inertiaMocks');

    return {
        ...inertiaMock,
        useForm: (initialData: Record<string, unknown> = {}) =>
            useFormMock(initialData),
    };
});

const categories = { branding: 'Branding' };
const allowedIcons = ['sparkles', 'rocket'];

const plans = {
    basic: { price: '$99', delivery: '3 Days', features: ['Logo design'] },
    standard: {
        price: '$199',
        delivery: '5 Days',
        features: ['Logo design', 'Brand guide'],
    },
    premium: {
        price: '$399',
        delivery: '7 Days',
        features: ['Logo design', 'Brand guide', 'Social kit'],
    },
};

const descriptionPoints = Array.from({ length: 6 }, (_, i) => ({
    label: `Point ${i + 1}`,
    icon: 'sparkles',
}));

const faqs = [{ question: 'How long does it take?', answer: 'About a week.' }];

const subCategory = {
    id: 1,
    category_slug: 'branding',
    name: 'Logo & Identity',
    slug: 'logo-identity',
    description: 'Custom logo design package',
    price: '500 BDT',
    rating: 4.8,
    reviews_count: 12,
    image_url: null,
    sort_order: 0,
    plans,
    faqs,
    description_points: descriptionPoints,
    gallery: [],
};

const emptySubCategory = { ...subCategory, name: '' };

describe('Admin PortfolioSubCategory Edit', () => {
    it('renders without crashing', () => {
        render(
            <PortfolioSubCategoryEdit
                subCategory={subCategory}
                categories={categories}
                allowed_icons={allowedIcons}
            />,
        );

        expect(
            screen.getByRole('heading', { name: 'Edit Sub-Category' }),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue('Logo & Identity')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /update sub-category/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(
            <PortfolioSubCategoryEdit
                subCategory={subCategory}
                categories={categories}
                allowed_icons={allowedIcons}
            />,
        );

        const nameInput = screen.getByDisplayValue('Logo & Identity');

        await user.clear(nameInput);
        await user.type(nameInput, 'Logo & Identity Pro');

        expect(nameInput).toHaveValue('Logo & Identity Pro');
    });

    it('shows a validation error message when submitting with no name', async () => {
        const { container } = render(
            <PortfolioSubCategoryEdit
                subCategory={emptySubCategory}
                categories={categories}
                allowed_icons={allowedIcons}
            />,
        );

        const form = container.querySelectorAll('form')[0];
        expect(form).not.toBeUndefined();

        fireEvent.submit(form);

        expect(
            await screen.findByText(/Sub-category name is required\./),
        ).toBeInTheDocument();
    });
});
