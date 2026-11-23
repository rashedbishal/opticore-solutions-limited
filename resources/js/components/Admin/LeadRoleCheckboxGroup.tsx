export type LeadRoleValue = 'agent' | 'manager';

interface LeadRoleOption {
    value: LeadRoleValue;
    label: string;
}

interface Props {
    options: LeadRoleOption[];
    value: LeadRoleValue | null;
    onChange: (value: LeadRoleValue | null) => void;
}

/**
 * Lead Management role picker on the admin create/edit form. Two
 * tick-boxes that behave as one choice: ticking one unticks the other, and
 * unticking the ticked one clears the role. Independent of "full access",
 * which never grants a lead role.
 */
export function LeadRoleCheckboxGroup({ options, value, onChange }: Props) {
    return (
        <div className="space-y-3 border-t border-violet-500/10 pt-5">
            <label className="block font-mono text-[10px] font-medium tracking-[0.18em] text-violet-400/70 uppercase">
                Lead Management
            </label>
            <p className="text-xs text-zinc-500">
                Agents see only the leads assigned to them. Managers see every
                lead. Leave both unticked for no lead access.
            </p>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options.map((option) => (
                    <div key={option.value} className="flex items-center gap-3">
                        <input
                            id={`lead-role-${option.value}`}
                            type="checkbox"
                            checked={value === option.value}
                            onChange={(e) =>
                                onChange(e.target.checked ? option.value : null)
                            }
                            className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-500"
                        />
                        <label
                            htmlFor={`lead-role-${option.value}`}
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
