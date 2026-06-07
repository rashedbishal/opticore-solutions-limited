import type { ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { FaqForm } from './Create';

interface FaqData {
    id: number;
    question: string;
    answer: string;
    sort_order: number;
    is_active: boolean;
}

interface Props {
    faq: FaqData;
}

export default function FaqEdit({ faq }: Props) {
    return <FaqForm faq={faq} />;
}

FaqEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit FAQ">{page}</AdminLayout>
);
