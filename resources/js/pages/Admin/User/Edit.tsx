import type { LeadRoleValue } from '@/components/Admin/LeadRoleCheckboxGroup';
import type { FormEventHandler, ReactNode } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CmsErrorDialog } from '@/components/Admin/CmsErrorDialog';
import { LeadRoleCheckboxGroup } from '@/components/Admin/LeadRoleCheckboxGroup';
import { PermissionCheckboxGroup } from '@/components/Admin/PermissionCheckboxGroup';
import AdminLayout from '@/components/Layout/AdminLayout';
import adminRoutes from '@/routes/admin';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        full_access: boolean;
        permissions: string[] | null;
        lead_role: LeadRoleValue | null;
    };
    permissionOptions: { key: string; label: string }[];
    leadRoleOptions: { value: LeadRoleValue; label: string }[];
    canEditProfile: boolean;
    canEditPermissions: boolean;
    isEditingSelf: boolean;
}

export default function UserEdit({
    user,
    permissionOptions,
    leadRoleOptions,
    canEditProfile,
    canEditPermissions,
    isEditingSelf,
}: Props) {
    const [errorMessages, setErrorMessages] = useState<string[]>([]);
    const { data, setData, put, processing } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        full_access: user.full_access,
        permissions: user.permissions ?? ([] as string[]),
        lead_role: user.lead_role,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const v: string[] = [];

        if (canEditProfile) {
            if (!data.name.trim()) {
                v.push('Name is required.');
            }

            if (!data.email.trim()) {
                v.push('Email address is required.');
            }
        }

        if (data.password && data.password.length < 8) {
            v.push('New password must be at least 8 characters.');
        }

        if (v.length > 0) {
            setErrorMessages(v);

            return;
        }

        put(adminRoutes.users.update.url(user.id), {
            onError: (errs) =>
                setErrorMessages(
                    Object.values(errs).filter(Boolean) as string[],
                ),
        });
    };

    return (
        <div className="max-w-2xl">
            <CmsErrorDialog
                messages={errorMessages}
                onClose={() => setErrorMessages([])}
            />
            <h1 className="mb-6 text-2xl font-bold text-white">Edit Admin</h1>
            <div className="relative overflow-hidden rounded-xl border border-violet-500/15 bg-[#060c1a]/80 p-6 backdrop-blur-sm">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
                <form onSubmit={submit} className="space-y-6">
                    {canEditProfile ? (
                        <>
                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                                    Password (Leave blank to keep current)
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className="block w-full rounded-lg border border-white/8 bg-white/4 px-4 py-2.5 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                                    minLength={8}
                                />
                            </div>
                        </>
                    ) : (
                        <p className="text-sm text-zinc-500">
                            You don&apos;t have permission to modify this
                            admin&apos;s profile, password, or permissions.
                        </p>
                    )}

                    {canEditPermissions ? (
                        <>
                            <PermissionCheckboxGroup
                                options={permissionOptions}
                                fullAccess={data.full_access}
                                permissions={data.permissions}
                                onFullAccessChange={(value) =>
                                    setData('full_access', value)
                                }
                                onPermissionsChange={(permissions) =>
                                    setData('permissions', permissions)
                                }
                            />
                            <LeadRoleCheckboxGroup
                                options={leadRoleOptions}
                                value={data.lead_role}
                                onChange={(value) =>
                                    setData('lead_role', value)
                                }
                            />
                        </>
                    ) : (
                        <p className="border-t border-violet-500/10 pt-5 text-sm text-zinc-500">
                            {isEditingSelf
                                ? 'You cannot change your own permissions.'
                                : "Only the primary administrator can change this admin's permissions."}
                        </p>
                    )}

                    <div className="flex gap-4 border-t border-violet-500/10 pt-4">
                        {canEditProfile && (
                            <button
                                disabled={processing}
                                type="submit"
                                className="relative flex items-center gap-2 overflow-hidden rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-600 via-violet-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(124,58,237,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-400/50 hover:from-violet-500 hover:via-violet-400 hover:to-cyan-400 hover:shadow-[0_0_38px_rgba(124,58,237,0.65),inset_0_1px_0_rgba(255,255,255,0.2)] hover:before:translate-x-full disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />{' '}
                                        Updating...
                                    </>
                                ) : (
                                    'Update Admin'
                                )}
                            </button>
                        )}
                        <Link
                            href={adminRoutes.users.index.url()}
                            className="relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all before:pointer-events-none before:absolute before:inset-0 before:-translate-x-full before:-skew-x-12 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:transition-transform before:duration-500 hover:border-violet-500/25 hover:bg-violet-500/[0.08] hover:text-white hover:shadow-[0_0_14px_rgba(124,58,237,0.1)] hover:before:translate-x-full"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

UserEdit.layout = (page: ReactNode) => (
    <AdminLayout title="Edit Admin">{page}</AdminLayout>
);
