import type {
    LeadDetail as LeadDetailData,
    LeadDetailOptions,
} from '@/types/leads';
import { AnimatePresence, m as motion } from 'framer-motion';
import { useEffect } from 'react';
import LeadDetail from '@/components/Admin/Leads/LeadDetail';

interface Props extends LeadDetailOptions {
    lead: LeadDetailData | null;
    onClose: () => void;
}

/**
 * The slide-over side panel that shows a lead on top of the list/board.
 */
export default function LeadPanel({ lead, onClose, ...options }: Props) {
    useEffect(() => {
        if (!lead) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        return () => document.removeEventListener('keydown', onKeyDown);
    }, [lead, onClose]);

    return (
        <AnimatePresence>
            {lead && (
                <div className="fixed inset-0 z-[90] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.aside
                        role="dialog"
                        aria-label={`Lead ${lead.identifier}`}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-full w-full max-w-3xl overflow-y-auto border-l border-violet-500/20 bg-[#03050d] p-4 shadow-2xl sm:p-6"
                    >
                        <LeadDetail
                            lead={lead}
                            {...options}
                            inPanel
                            onClose={onClose}
                        />
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
}
