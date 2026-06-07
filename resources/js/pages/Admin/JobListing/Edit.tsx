import type { ReactNode } from 'react';
import AdminLayout from '@/components/Layout/AdminLayout';
import { JobListingForm } from './Create';

interface JobListingData {
    id: number;
    title: string;
    location: string;
    type: string;
    description: string;
    sort_order: number;
    is_active: boolean;
}

interface Props {
    jobListing: JobListingData;
}

export default function JobListingEdit({ jobListing }: Props) {
    return <JobListingForm jobListing={jobListing} />;
}

JobListingEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Job Listing">{page}</AdminLayout>
);
