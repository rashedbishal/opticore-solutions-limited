export type User = {
    id: number;
    name: string;
    email: string;
    phone_number?: string | null;
    address?: string | null;
    country?: string | null;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    is_super_admin?: boolean;
    full_access?: boolean;
    permissions?: string[] | null;
    section_roles?: string[] | null;
    lead_role?: 'agent' | 'manager' | null;
    [key: string]: unknown; // This allows for additional properties...
};

export type Auth = {
    user: User;
};
