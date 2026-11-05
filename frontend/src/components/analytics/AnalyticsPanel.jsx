import React, { useCallback, useEffect, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle, CheckCircle, Clock, Timer, Users, RefreshCw } from 'lucide-react';
import api, { getErrorMessage } from '../../utils/api';
import socketService from '../../utils/socket';
import useAuthStore from '../../stores/authStore';
import { INCIDENT_TYPE_OPTIONS, STATUS_LABELS, SEVERITY_OPTIONS, TYPE_COLORS } from '../../utils/constants';
import { formatHours, capitalize } from '../../utils/helpers';
import Loading from '../common/Loading';

const SEVERITY_COLORS = { low: '#10b981', medium: '#eab308', high: '#f97316', critical: '#ef4444' };
const STATUS_COLORS = { reported: '#eab308', verified: '#3b82f6', 'in-progress': '#8b5cf6', resolved: '#10b981', false: '#6b7280' };

const tooltipStyle = {
    contentStyle: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' },
    labelStyle: { color: '#fff' }
};

const StatCard = ({ icon: Icon, label, value, hint, tone }) => {
    const tones = {
        blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',
        green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-300',
        yellow: 'from-yellow-500/20 to-orange-500/10 border-yellow-500/30 text-yellow-300',
        red: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-300',
        purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300'
    };
    return (
        <div className={`p-5 rounded-2xl bg-gradient-to-br ${tones[tone]} border`}>
            <div className="flex items-center justify-between mb-2">
                <Icon className="w-6 h-6" />
                <div className="text-3xl font-black text-white">{value}</div>
            </div>
            <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
            {hint && <div className="text-[11px] text-gray-400 mt-1">{hint}</div>}
        </div>
    );
};

const ChartCard = ({ title, children }) => (
    <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/10">
        <h3 className="text-base font-bold mb-4 text-white">{title}</h3>
        {children}
    </div>
);

const EmptyChart = () => <div className="h-[260px] flex items-center justify-center text-sm text-gray-500">No data yet</div>;

/**
 * Analytics dashboard backed by /api/analytics/stats and /api/analytics/trends.
 * Refreshes automatically when incidents change in real time.
 */
const AnalyticsPanel = () => {
    const token = useAuthStore((s) => s.token);
    const [days, setDays] = useState(7);
    const [stats, setStats] = useState(null);
    const [trends, setTrends] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [s, t] = await Promise.all([
                api.get('/analytics/stats'),
                api.get('/analytics/trends', { params: { days } })
            ]);
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

    useEffect(() => {
        load();
    }, [load, token]);

    // Live refresh (debounced) on any incident change
    useEffect(() => {
        let timer;
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(load, 1500);
        };
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted']
            .map(evt => socketService.on(evt, schedule));
        return () => {
            clearTimeout(timer);
            offs.forEach(off => off());
        };
    }, [load]);

    if (loading) return <Loading text="Loading analytics..." />;
    if (error && !stats) {
        return (
            <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                {error} <button onClick={load} className="underline ml-2">Retry</button>
            </div>
        );
    }

    const typeData = INCIDENT_TYPE_OPTIONS
        .map(o => ({ name: capitalize(o.value), key: o.value, value: stats.byType[o.value] || 0 }))
        .filter(d => d.value > 0);
    const statusData = Object.keys(STATUS_LABELS).map(s => ({ name: STATUS_LABELS[s], key: s, value: stats.byStatus[s] || 0 }));
    const severityData = SEVERITY_OPTIONS.map(o => ({ name: o.label, key: o.value, value: stats.bySeverity[o.value] || 0 }));
    const resolutionRate = stats.totalIncidents
        ? Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Activity} tone="blue" label="Total incidents" value={stats.totalIncidents} hint={`${stats.recentIncidents} in the last 24h`} />
                <StatCard icon={AlertCircle} tone="red" label="Open incidents" value={stats.openIncidents} hint={`${stats.criticalOpen} high/critical · ${stats.unassignedOpen} unassigned`} />
                <StatCard icon={CheckCircle} tone="green" label="Resolved" value={stats.resolvedIncidents} hint={`${resolutionRate}% resolution rate`} />
                <StatCard icon={Clock} tone="purple" label="Avg. resolution time" value={formatHours(stats.avgResolutionTimeHours)} hint={`First response: ${formatHours(stats.avgResponseTimeHours)}`} />
            </div>

            {stats.totalUsers !== undefined && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Users} tone="blue" label="Registered users" value={stats.totalUsers} />
                    <StatCard icon={Timer} tone="yellow" label="Active responders" value={stats.activeResponders} hint={`${stats.inProgressIncidents} incidents in progress`} />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    {[7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${days === d ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                        >
                            {d} days
                        </button>
                    ))}
                </div>
                <button onClick={load} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Refresh analytics">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title={`Incidents per day (last ${days} days)`}>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={trends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                            <Tooltip {...tooltipStyle} />
                            <Legend />
                            <Area type="monotone" name="Reported" dataKey="reported" stroke="#3b82f6" fill="#3b82f633" />
                            <Area type="monotone" name="High/critical" dataKey="critical" stroke="#ef4444" fill="#ef444422" />
                            <Area type="monotone" name="Resolved" dataKey="resolved" stroke="#10b981" fill="#10b98122" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Incidents by type">
                    {typeData.length === 0 ? <EmptyChart /> : (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                    {typeData.map(d => <Cell key={d.key} fill={TYPE_COLORS[d.key]} />)}
                                </Pie>
                                <Tooltip {...tooltipStyle} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard title="Incidents by status">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={statusData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                            <Tooltip {...tooltipStyle} cursor={{ fill: '#ffffff08' }} />
                            <Bar dataKey="value" name="Incidents" radius={[6, 6, 0, 0]}>
                                {statusData.map(d => <Cell key={d.key} fill={STATUS_COLORS[d.key]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Incidents by severity">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={severityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                            <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                            <Tooltip {...tooltipStyle} cursor={{ fill: '#ffffff08' }} />
                            <Bar dataKey="value" name="Incidents" radius={[6, 6, 0, 0]}>
                                {severityData.map(d => <Cell key={d.key} fill={SEVERITY_COLORS[d.key]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
};

export default AnalyticsPanel;
