export type LeadRoleValue = 'agent' | 'manager';

interface LeadRoleOption {
    value: LeadRoleValue;
    label: string;
}

interface Props {
    options: LeadRoleOption[];
    value: LeadRoleValue | null;
    onChange: (value: LeadRoleValue | null) => void;
    /** Lead sources, for choosing which unowned leads an agent may see. */
    sourceOptions: { id: string; name: string }[];
    unassignedSourceIds: string[];
    onUnassignedSourcesChange: (ids: string[]) => void;
}

/**
 * Lead Management role picker on the admin create/edit form. Two
 * tick-boxes that behave as one choice: ticking one unticks the other, and
 * unticking the ticked one clears the role. Independent of "full access",
 * which never grants a lead role.
 */
export function LeadRoleCheckboxGroup({
    options,
    value,
    onChange,
    sourceOptions,
    unassignedSourceIds,
    onUnassignedSourcesChange,
}: Props) {
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

            {value === 'agent' && sourceOptions.length > 0 && (
                <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/[0.03] px-3 py-3">
                    <p className="text-sm text-cyan-100/90">
                        Can see unowned leads from:
                    </p>
                    <p className="mb-2 text-xs text-zinc-500">
                        This agent will see new leads from these sources before
                        anyone is assigned (they can&apos;t take them for
                        themselves).
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {sourceOptions.map((source) => (
                            <label
                                key={source.id}
                                className="flex items-center gap-3 text-sm text-zinc-300"
                            >
                                <input
                                    type="checkbox"
                                    checked={unassignedSourceIds.includes(
                                        source.id,
                                    )}
                                    onChange={(e) =>
                                        onUnassignedSourcesChange(
                                            e.target.checked
                                                ? [
                                                      ...unassignedSourceIds,
                                                      source.id,
                                                  ]
                                                : unassignedSourceIds.filter(
                                                      (id) => id !== source.id,
                                                  ),
                                        )
                                    }
                                    className="h-4 w-4 rounded border-white/20 bg-white/5 accent-cyan-500"
                                />
                                {source.name}
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
