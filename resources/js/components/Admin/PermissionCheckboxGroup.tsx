interface PermissionOption {
    key: string;
    label: string;
}

interface Props {
    options: PermissionOption[];
    fullAccess: boolean;
    permissions: string[];
    onFullAccessChange: (value: boolean) => void;
    onPermissionsChange: (permissions: string[]) => void;
}

export function PermissionCheckboxGroup({
    options,
    fullAccess,
    permissions,
    onFullAccessChange,
    onPermissionsChange,
}: Props) {
    const togglePermission = (key: string, checked: boolean) => {
        onPermissionsChange(
            checked
                ? [...permissions, key]
                : permissions.filter((value) => value !== key),
        );
    };

    return (
        <div className="space-y-3 border-t border-violet-500/10 pt-5">
            <label className="block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                Permissions
            </label>

            <div className="flex items-center gap-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5">
                <input
                    id="full_access"
                    type="checkbox"
                    checked={fullAccess}
                    onChange={(e) => onFullAccessChange(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-500"
                />
                <label
                    htmlFor="full_access"
                    className="text-sm font-medium text-cyan-200"
                >
                    Allow full access
                    <span className="ml-1.5 font-normal text-cyan-200/60">
                        (overrides individual selections and grants access to
                        every section)
                    </span>
                </label>
            </div>

            <div
                className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${fullAccess ? 'pointer-events-none opacity-40' : ''}`}
            >
                {options.map((option) => (
                    <div key={option.key} className="flex items-center gap-3">
                        <input
                            id={`perm-${option.key}`}
                            type="checkbox"
                            disabled={fullAccess}
                            checked={permissions.includes(option.key)}
                            onChange={(e) =>
                                togglePermission(option.key, e.target.checked)
                            }
                            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500 disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor={`perm-${option.key}`}
                            className="text-sm text-zinc-300"
                        >
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
