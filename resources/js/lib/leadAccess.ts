/**
 * Mirrors Admin::leadRole() server-side. Display only: every lead route is
 * also enforced on the server (EnsureAdminHasPermission). The mother admin
 * is always a Manager; `full_access` deliberately grants no lead role.
 */
type LeadAdmin =
    | { is_super_admin?: boolean; lead_role?: string | null }
    | undefined
    | null;

export type LeadRole = 'agent' | 'manager';

export function leadRole(admin: LeadAdmin): LeadRole | null {
    if (admin?.is_super_admin) {
        return 'manager';
    }

    return admin?.lead_role === 'agent' || admin?.lead_role === 'manager'
        ? admin.lead_role
        : null;
}

export function canUseLeads(admin: LeadAdmin): boolean {
    return leadRole(admin) !== null;
}

/** Lead Settings (statuses, currencies, keys…) are mother-admin-only. */
export function canManageLeadSettings(admin: LeadAdmin): boolean {
    return admin?.is_super_admin === true;
}
