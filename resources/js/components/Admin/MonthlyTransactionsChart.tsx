import type { TooltipContentProps } from 'recharts';
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export interface TransactionMonth {
    month: string;
    revenue: number;
    count: number;
}

interface MonthlyTransactionsChartProps {
    data: TransactionMonth[];
}

const axisTick = { fill: '#64748b', fontSize: 11, fontFamily: 'monospace' };

function monthTick(value: string) {
    return value.split(' ')[0];
}

function compactNumber(value: number) {
    if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
    }

    return `${value}`;
}

function ChartTooltip({
    active,
    payload,
    label,
}: Partial<TooltipContentProps<number, string>>) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div
            className="rounded-lg border border-violet-500/20 bg-[#060c1a]/95 px-3 py-2 shadow-2xl backdrop-blur-xl"
            style={{ boxShadow: '0 0 30px rgba(139,92,246,0.15)' }}
        >
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.2em] text-violet-400/70 uppercase">
                {label}
            </p>
            <div className="space-y-1">
                {payload.map((entry) => (
                    <p
                        key={String(entry.dataKey)}
                        className="flex items-center justify-between gap-3 text-xs"
                    >
                        <span className="flex items-center gap-1.5 text-slate-400">
                            <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: entry.color }}
                            />
                            {entry.name}
                        </span>
                        <span className="font-mono font-semibold text-white">
                            {Number(entry.value ?? 0).toLocaleString()}
                        </span>
                    </p>
                ))}
            </div>
        </div>
    );
}

export default function MonthlyTransactionsChart({
    data,
}: MonthlyTransactionsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
                data={data}
                margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            >
                <defs>
                    <linearGradient
                        id="revenueFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                    >
                        <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.6}
                        />
                        <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.05}
                        />
                    </linearGradient>
                </defs>
                <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(139,92,246,0.08)"
                    vertical={false}
                />
                <XAxis
                    dataKey="month"
                    tickFormatter={monthTick}
                    stroke="rgba(148,163,184,0.15)"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    yAxisId="revenue"
                    allowDecimals={false}
                    tickFormatter={compactNumber}
                    stroke="rgba(148,163,184,0.15)"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                />
                <YAxis
                    yAxisId="count"
                    orientation="right"
                    allowDecimals={false}
                    stroke="rgba(148,163,184,0.15)"
                    tick={axisTick}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                />
                <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ fill: 'rgba(139,92,246,0.05)' }}
                />
                <Bar
                    yAxisId="revenue"
                    dataKey="revenue"
                    name="Revenue"
                    fill="url(#revenueFill)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                />
                <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22d3ee', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                />
            </ComposedChart>
        </ResponsiveContainer>
    );
}
