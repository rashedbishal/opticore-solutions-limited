export interface LeadStatusOption {
    id: string;
    name: string;
    color: string;
    is_closed: boolean;
}

export interface PriorityOption {
    value: string;
    label: string;
    color: string;
}

export interface CurrencyOption {
    id: string;
    code: string;
    name: string;
}

export interface AssignableUser {
    id: number;
    name: string;
}

export interface LeadRow {
    id: string;
    identifier: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    status_id: string;
    priority: string;
    source: { type: string; name: string };
    assigned_to: number | null;
    assigned_to_name: string | null;
    meeting_alert: boolean;
    follow_up_alert: boolean;
    has_unseen_update: boolean;
    created_at: string | null;
}

export interface LeadActivityEvent {
    type: string;
    created_at: string | null;
    user: string | null;
    old_status?: string | null;
    new_status?: string | null;
    assigned_to?: string | null;
    note?: string | null;
    action_date?: string | null;
    fields?: string[];
}

export interface LeadDetail extends LeadRow {
    message: string | null;
    website: string | null;
    industry: string | null;
    location: string | null;
    service_interest: string | null;
    lead_source: string | null;
    estimated_budget: string | null;
    estimated_budget_currency_id: string | null;
    estimated_budget_currency: string | null;
    deal_value: string | null;
    deal_value_currency_id: string | null;
    deal_value_currency: string | null;
    win_probability: number | null;
    next_follow_up_at: string | null;
    meeting_date: string | null;
    meeting_time: string | null;
    meeting_time_label: string | null;
    meeting_due: boolean;
    follow_up_due: boolean;
    first_contacted_at: string | null;
    closed_at: string | null;
    is_manual: boolean;
    can: { update: boolean; assign: boolean; delete: boolean };
    activity: LeadActivityEvent[];
    avatar_url: string | null;
    subject: string | null;
    html_body: string | null;
    website_form_name: string | null;
    conversation: ConversationItem[];
}

export type ConversationItem =
    | {
          kind: 'message';
          id: string;
          channel: string;
          direction: 'inbound' | 'outbound';
          body: string | null;
          sent_by_name: string | null;
          status: string | null;
          at: string | null;
      }
    | {
          kind: 'attachment';
          id: string;
          type: string;
          status: 'downloading' | 'downloaded' | 'failed';
          mime: string | null;
          url: string | null;
          at: string | null;
      };

export interface LeadFilterValues {
    search: string;
    status: string;
    priority: string;
    assigned_to: string;
    from: string;
    to: string;
}

/** Everything the lead detail needs besides the lead itself. */
export interface LeadDetailOptions {
    statuses: LeadStatusOption[];
    priorities: PriorityOption[];
    currencies: CurrencyOption[];
    assignableUsers: AssignableUser[];
}
