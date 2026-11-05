import React, { useCallback, useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import api, { getErrorMessage } from '../../utils/api';
import socketService from '../../utils/socket';
import useAuthStore from '../../stores/authStore';
import { INCIDENT_TYPE_OPTIONS, STATUS_LABELS, STATUS_COLORS, SEVERITY_OPTIONS, SEVERITY_COLORS } from '../../utils/constants';
import { formatHours } from '../../utils/helpers';
import { Button, Segmented, Spinner, Stat, StatRow } from '../ui';
import { AnimatedNumber, EASE, Reveal } from '../ui/motion';

const AXIS = { stroke: '#9C9BA3', fontSize: 12, tickLine: false, axisLine: false };
const GRID = { stroke: '#E6E3DC', vertical: false };

const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-ink px-3.5 py-2.5 text-[13px] text-paper shadow-xl">
            {label && <div className="mb-1 font-medium">{label}</div>}
            {payload.map(p => (
                <div key={p.dataKey} className="flex items-center gap-2 text-paper/80">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
                    {p.name}: <span className="font-semibold text-paper">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

// Horizontal proportional bars (cardless "chart" for categorical breakdowns)
const Breakdown = ({ rows, total }) => (
    <ul className="space-y-4">
        {rows.map((row, i) => {
            const pct = total ? (row.value / total) * 100 : 0;
            return (
                <li key={row.key}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                        <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: row.color }} />{row.name}</span>
                        <span className="font-mono text-[13px] tabular-nums text-ink-muted">{row.value} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-paper-deep">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: row.color }}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.9, ease: EASE, delay: i * 0.05 }}
                        />
                    </div>
                </li>
            );
        })}
    </ul>
);

const Block = ({ title, description, children, className = '' }) => (
    <Reveal className={`border-t border-line pt-6 ${className}`}>
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        {description && <p className="mt-1 text-[13px] text-ink-muted">{description}</p>}
        <div className="mt-6">{children}</div>
    </Reveal>
);

/**
 * Analytics backed by /api/analytics/stats and /trends.
 * Reloads on real-time events (or the polling fallback's data_refresh).
 */
const AnalyticsPanel = () => {
    const token = useAuthStore((s) => s.token);
    const [days, setDays] = useState(14);
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [s, t] = await Promise.all([api.get('/analytics/stats'), api.get('/analytics/trends', { params: { days } })]);
            setStats(s.data.data);
            setTrends(t.data.data.map(d => ({
                ...d,
                label: new Date(`${d.date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
            })));
            setError(null);
        } catch (err) {
            setError(getErrorMessage(err, 'Failed to load analytics'));
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => { load(); }, [load, token]);

    useEffect(() => {
        let timer;
        const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 1500); };
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted', 'data_refresh'].map(evt => socketService.on(evt, schedule));
        return () => { clearTimeout(timer); offs.forEach(off => off()); };
    }, [load]);

    if (loading) return <Spinner label="Loading analytics" />;
    if (error && !stats) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm text-sev-critical">{error}</p>
                <Button variant="outline" className="mt-4" onClick={load}>Try again</Button>
            </div>
        );
    }

    const total = stats.totalIncidents;
    const typeRows = INCIDENT_TYPE_OPTIONS.map(o => ({ key: o.value, name: o.label, value: stats.byType[o.value] || 0, color: o.color }))
        .sort((a, b) => b.value - a.value);
    const statusData = Object.keys(STATUS_LABELS).map(s => ({ key: s, name: STATUS_LABELS[s], value: stats.byStatus[s] || 0, fill: STATUS_COLORS[s] }));
    const severityRows = SEVERITY_OPTIONS.map(o => ({ key: o.value, name: o.label, value: stats.bySeverity[o.value] || 0, color: SEVERITY_COLORS[o.value] })).reverse();
    const resolutionRate = total ? Math.round((stats.resolvedIncidents / total) * 100) : 0;
    const reportedInRange = trends.reduce((sum, d) => sum + d.reported, 0);

    return (
        <div className="space-y-14">
            <StatRow>
                <Stat label="Total incidents" value={<AnimatedNumber value={total} />} hint={`${stats.recentIncidents} in the last 24h`} />
                <Stat label="Open now" value={<AnimatedNumber value={stats.openIncidents} />} tone="#E5402A" hint={`${stats.criticalOpen} high/critical · ${stats.unassignedOpen} unassigned`} />
                <Stat label="Resolution rate" value={<><AnimatedNumber value={resolutionRate} />%</>} tone="#2F9E6E" hint={`${stats.resolvedIncidents} resolved`} />
                <Stat label="Avg. time to resolve" value={formatHours(stats.avgResolutionTimeHours)} hint={`First response ${formatHours(stats.avgResponseTimeHours)}`} />
            </StatRow>

            {stats.totalUsers !== undefined && (
                <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-ink-muted">
                    <span><strong className="font-display text-2xl font-semibold text-ink">{stats.totalUsers}</strong> registered users</span>
                    <span><strong className="font-display text-2xl font-semibold text-ink">{stats.activeResponders}</strong> active responders</span>
                    <span><strong className="font-display text-2xl font-semibold text-ink">{stats.inProgressIncidents}</strong> in progress now</span>
                </div>
            )}

            <Reveal>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h3 className="text-base font-semibold tracking-tight">Reports over time</h3>
                        <p className="mt-1 text-[13px] text-ink-muted">{reportedInRange} reported in the last {days} days</p>
                    </div>
                    <Segmented options={[{ value: 7, label: '7d' }, { value: 14, label: '14d' }, { value: 30, label: '30d' }]} value={days} onChange={setDays} />
                </div>
                <div className="mt-8 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trends} margin={{ left: -20, right: 8, top: 8 }}>
                            <defs>
                                <linearGradient id="fillReported" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#16161A" stopOpacity={0.12} />
                                    <stop offset="100%" stopColor="#16161A" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid {...GRID} />
                            <XAxis dataKey="label" {...AXIS} minTickGap={24} />
                            <YAxis {...AXIS} allowDecimals={false} />
                            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#D3CFC6' }} />
                            <Area type="monotone" name="Reported" dataKey="reported" stroke="#16161A" strokeWidth={2} fill="url(#fillReported)" />
                            <Area type="monotone" name="High/critical" dataKey="critical" stroke="#E5402A" strokeWidth={2} fill="transparent" />
                            <Area type="monotone" name="Resolved" dataKey="resolved" stroke="#2F9E6E" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-5 text-[13px] text-ink-muted">
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-ink" /> Reported</span>
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 bg-signal" /> High / critical</span>
                    <span className="flex items-center gap-2"><span className="h-0.5 w-4 border-t-2 border-dashed border-sev-low" /> Resolved</span>
                </div>
            </Reveal>

            <div className="grid gap-12 lg:grid-cols-3">
                <Block title="By type" description="Share of all reports">
                    <Breakdown rows={typeRows} total={total} />
                </Block>
                <Block title="By severity" description="How serious reports are">
                    <Breakdown rows={severityRows} total={total} />
                </Block>
                <Block title="By status" description="Where incidents are in the workflow">
                    <div className="h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={statusData} margin={{ left: -24, right: 0 }}>
                                <CartesianGrid {...GRID} />
                                <XAxis dataKey="name" {...AXIS} fontSize={11} interval={0} tickFormatter={(v) => v.split(' ')[0]} />
                                <YAxis {...AXIS} allowDecimals={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#F3F1EC' }} />
                                <Bar dataKey="value" name="Incidents" radius={[6, 6, 0, 0]} maxBarSize={36}>
                                    {statusData.map(d => <Cell key={d.key} fill={d.fill} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Block>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
