import type {
    LeadDetail as LeadDetailData,
    LeadDetailOptions,
} from '@/types/leads';
import type { ReactNode } from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import LeadDetail from '@/components/Admin/Leads/LeadDetail';
import LeadsLiveRefresh from '@/components/Admin/Leads/LeadsLiveRefresh';
import AdminLayout from '@/components/Layout/AdminLayout';
import leadRoutes from '@/routes/admin/leads';

interface Props extends LeadDetailOptions {
    lead: LeadDetailData;
}

/** A lead on its own page (the same detail as the side panel). */
export default function LeadShow({ lead, ...options }: Props) {
    return (
        <div className="mx-auto max-w-5xl space-y-4">
            <LeadsLiveRefresh only={['lead']} />
            <Link
                href={leadRoutes.index.url()}
                className="inline-flex items-center gap-2 font-mono text-xs text-zinc-400 transition-colors hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" /> All leads
            </Link>
            <LeadDetail lead={lead} {...options} />
        </div>
    );
}

LeadShow.layout = (page: ReactNode) => (
    <AdminLayout title="Lead">{page}</AdminLayout>
);
