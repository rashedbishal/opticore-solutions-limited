import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioEdit from '@/pages/Admin/Portfolio/Edit';

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

const portfolio = {
    id: 1,
    title: 'Brand Refresh',
    category: 'graphic-design',
    sub_category_id: 5,
    alt: 'Brand refresh cover',
    media_path: '/storage/portfolio/brand-refresh.jpg',
    media_type: 'image' as const,
    youtube_video_id: null,
};

const subCategoriesByCategory = {
    'graphic-design': [{ id: 5, name: 'Logo Design', slug: 'logo-design' }],
};

const subCategoriesByCategoryEmpty = { 'graphic-design': [] };

describe('Admin Portfolio Edit', () => {
    it('renders without crashing', () => {
        render(
            <PortfolioEdit
                portfolio={portfolio}
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategory}
            />,
        );

        expect(screen.getByText('Edit Portfolio')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Brand Refresh')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /update portfolio/i }),
        ).toBeInTheDocument();
    });

    it('updates field values as the user types', async () => {
        const user = userEvent.setup();
        render(
            <PortfolioEdit
                portfolio={portfolio}
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategory}
            />,
        );

        const titleInput = screen.getByDisplayValue('Brand Refresh');

        await user.clear(titleInput);
        await user.type(titleInput, 'Brand Refresh 2024');

        expect(titleInput).toHaveValue('Brand Refresh 2024');
    });

    it('shows a validation error message when submitting with no sub-category selected', async () => {
        const { container } = render(
            <PortfolioEdit
                portfolio={{ ...portfolio, sub_category_id: null }}
                categories={categories}
                subCategoriesByCategory={subCategoriesByCategoryEmpty}
            />,
        );

        const form = container.querySelector('form');
        expect(form).not.toBeNull();

        fireEvent.submit(form!);

        expect(
            await screen.findByText(/Please select a sub-category\./),
        ).toBeInTheDocument();
    });
});
