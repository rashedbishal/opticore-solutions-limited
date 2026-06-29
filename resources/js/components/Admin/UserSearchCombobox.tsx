import { Loader2, Search, User as UserIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { userSearch } from '@/routes/admin/tasks';

export interface UserOption {
    id: number;
    name: string;
    email: string;
}

interface Props {
    onChange: (userId: number) => void;
    initialUser?: UserOption | null;
}

export default function UserSearchCombobox({
    onChange,
    initialUser = null,
}: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserOption[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<UserOption | null>(initialUser);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);

            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);

            try {
                const res = await fetch(
                    userSearch.url({ query: { q: query } }),
                );
                const data: UserOption[] = await res.json();
                setResults(data);
                setIsOpen(true);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    useEffect(() => {
        function handleOutsideClick(e: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutsideClick);

        return () =>
            document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    function handleSelect(user: UserOption) {
        setSelected(user);
        setQuery('');
        setResults([]);
        setIsOpen(false);
        onChange(user.id);
    }

    function handleClear() {
        setSelected(null);
        setQuery('');
        setResults([]);
        onChange(0);
    }

    return (
        <div ref={containerRef} className="relative">
            {selected ? (
                <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-4 py-2.5">
                    <UserIcon className="h-3.5 w-3.5 shrink-0 text-violet-400/60" />
                    <span className="flex-1 truncate text-sm text-white">
                        {selected.name}{' '}
                        <span className="text-zinc-400">
                            ({selected.email})
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={handleClear}
                        className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="block w-full rounded-lg border border-white/8 bg-white/4 py-2.5 pr-4 pl-9 text-sm text-white placeholder-white/20 transition-all outline-none focus:border-violet-500/50 focus:bg-violet-500/5"
                    />
                    {loading && (
                        <Loader2 className="pointer-events-none absolute top-1/2 right-3 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-400/60" />
                    )}
                </div>
            )}

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-white/8 bg-[#060c1a] shadow-xl">
                    {results.map((user) => (
                        <button
                            key={user.id}
                            type="button"
                            onClick={() => handleSelect(user)}
                            className="flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-violet-500/10"
                        >
                            <span className="text-sm text-white">
                                {user.name}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500">
                                {user.email}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {isOpen && !loading && query.trim() && results.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/8 bg-[#060c1a] px-4 py-3 text-sm text-zinc-500">
                    No users found for &ldquo;{query}&rdquo;
                </div>
            )}
        </div>
    );
}
