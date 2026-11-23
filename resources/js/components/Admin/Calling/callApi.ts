import { api } from '@/lib/apiFetch';
import leadRoutes from '@/routes/admin/leads';
import callRoutes from '@/routes/admin/leads/calls';

export interface ActiveCall {
    id: string;
    status: 'initiated' | 'ringing' | 'answering' | 'connected';
    direction: 'inbound' | 'outbound';
    claimed_by_me: boolean;
    lead: {
        id: string;
        name: string | null;
        phone: string | null;
        identifier: string | null;
    };
    assignee_name: string | null;
    receiving_as: 'assignee' | 'backup_fallback' | 'manager_fallback' | 'none';
    expires_in_seconds: number | null;
    connected_at: string | null;
}

export interface ActiveCallsResponse {
    calls: ActiveCall[];
    heartbeat_seconds: number;
    poll_seconds: number;
    staleness_seconds: number;
}

/** An error the call box can show, and whether trying again may help. */
export class CallError extends Error {
    constructor(
        public code: string,
        message: string,
        public retryable = false,
        public status = 0,
    ) {
        super(message);
        this.name = 'CallError';
    }
}

interface ActionResponse {
    data: {
        call: { id: string; status: string; claimed_by_me: boolean };
        session?: { sdp_type: 'offer' | 'answer'; sdp: string };
    };
}

async function action(
    url: string,
    body?: Record<string, unknown>,
): Promise<ActionResponse['data']> {
    try {
        const { data } = await api.post<ActionResponse>(url, body);

        return data.data;
    } catch (error) {
        const e = error as {
            status?: number;
            responseData?: {
                error?: {
                    code?: string;
                    message?: string;
                    retryable?: boolean;
                };
            };
        };
        const info = e.responseData?.error;
        const status = e.status ?? 0;

        throw new CallError(
            info?.code ?? (status === 0 ? 'network' : 'http_error'),
            info?.message ??
                (status === 0
                    ? 'No connection to the CMS. Check your internet.'
                    : 'Something went wrong.'),
            info?.retryable ?? (status === 0 || status >= 500),
            status,
        );
    }
}

export const callApi = {
    async active(): Promise<ActiveCallsResponse> {
        const { data } = await api.get<{ data: ActiveCallsResponse }>(
            callRoutes.active.url(),
        );

        return data.data;
    },
    claim: (id: string) => action(callRoutes.claim.url(id)),
    answer: (id: string, sdp: string) =>
        action(callRoutes.answer.url(id), { sdp_type: 'answer', sdp }),
    accept: (id: string) => action(callRoutes.accept.url(id)),
    reject: (id: string) => action(callRoutes.reject.url(id)),
    hangup: (id: string) => action(callRoutes.hangup.url(id)),
    call: (leadId: string, sdp: string) =>
        action(leadRoutes.call.url(leadId), { sdp }),
    outboundAnswer: (id: string) => action(callRoutes.outboundAnswer.url(id)),
    outboundConnected: (id: string) =>
        action(callRoutes.outboundConnected.url(id)),
    cancel: (id: string) => action(callRoutes.cancel.url(id)),
};

export type CallApi = typeof callApi;
