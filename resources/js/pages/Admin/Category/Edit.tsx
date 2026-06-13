import type { ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { CategoryForm } from './Create';

interface CategoryData {
    id: number;
    slug: string;
    label: string;
    description: string | null;
    sort_order: number;
}

interface Props {
    category: CategoryData;
}

export default function CategoryEdit({ category }: Props) {
    return <CategoryForm category={category} />;
}

CategoryEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Category">{page}</AdminLayout>
);
