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
    tags: LeadTagOption[];
    created_at: string | null;
}

export interface LeadTagOption {
    id: string;
    name: string;
    color: string;
}

export interface LeadDeal {
    id: string;
    name: string;
    value: string | null;
    currency_id: string | null;
    currency: string | null;
    probability: number | null;
    status: 'open' | 'won' | 'lost';
    expected_close_date: string | null;
    actual_close_date: string | null;
    owner_id: number | null;
    owner_name: string | null;
    notes: string | null;
}

export interface LeadTask {
    id: string;
    title: string;
    description: string | null;
    deal_id: string | null;
    deal_name: string | null;
    due_date: string | null;
    due_time: string | null;
    priority: string;
    status: 'pending' | 'completed' | 'cancelled';
    assigned_to: number | null;
    assigned_to_name: string | null;
    alert: boolean;
    can_delete: boolean;
}

export interface LeadCustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options: string[];
    is_required: boolean;
    value: string | null;
}

export interface LeadPipeline {
    all_tags: LeadTagOption[];
    deals: LeadDeal[];
    tasks: LeadTask[];
    custom_fields: LeadCustomField[];
    people: { id: number; name: string }[];
    can_delete_deals: boolean;
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
    name?: string;
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
    conversation: ConversationItem[];
    messaging: LeadMessaging | null;
    sent_messages: SentMessage[];
    consents: {
        current: Record<
            string,
            { status: string; source: string; occurred_at: string } | null
        >;
        history: ConsentEvent[];
    };
    can_delete_conversation: boolean;
    pipeline: LeadPipeline;
    duplicates: LeadDuplicate[];
}

export interface MessageTemplateOption {
    id: string;
    name: string;
    language: string;
    variable_count: number;
    body_text: string | null;
}

export interface LeadMessaging {
    channel: string;
    channel_label: string;
    has_conversation: boolean;
    can_reply: boolean;
    reply_blocked_reason: string | null;
    window_closes_at: string | null;
    supports_templates: boolean;
    can_send_template: boolean;
    template_blocked_reason: string | null;
    caption_supported: boolean;
    image_types: string[];
    image_max_mb: number;
    document_max_mb: number;
    templates: MessageTemplateOption[];
}

export interface SentMessage {
    id: string;
    type: string;
    body: string | null;
    template_name: string | null;
    template_variables: string[] | null;
    attachment_name: string | null;
    attachment_url: string | null;
    status: string | null;
    failure_reason: string | null;
    resent: boolean;
    sent_by_name: string | null;
    at: string | null;
}

export interface ConsentEvent {
    type: string;
    type_label: string;
    status: string;
    source: string;
    by: string | null;
    policy_version: string | null;
    policy_url: string | null;
    ip_address: string | null;
    occurred_at: string;
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
          failure_reason?: string | null;
          message_type?: string;
          template_name?: string | null;
          attachment_name?: string | null;
          attachment_mime?: string | null;
          attachment_url?: string | null;
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

export interface MergeConflict {
    label: string;
    survivor: string;
    loser: string;
}

export interface LeadDuplicate {
    link_id: string;
    matched_fields: string[];
    other: {
        id: string;
        identifier: string;
        name: string;
        email: string | null;
        phone: string | null;
        source: string;
        created_at: string | null;
        can_view: boolean;
    };
    conflicts_keep_this: Record<string, MergeConflict>;
    conflicts_keep_other: Record<string, MergeConflict>;
    can_merge: boolean;
}
