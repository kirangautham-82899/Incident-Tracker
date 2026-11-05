import React, { useCallback, useEffect, useState } from 'react';
import { Shield, Radio, Activity, Users } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import DispatchConsole from '../../components/admin/DispatchConsole';
import UserManagement from '../../components/admin/UserManagement';
import AnalyticsPanel from '../../components/analytics/AnalyticsPanel';
import useAuthStore from '../../stores/authStore';
import api from '../../utils/api';
import socketService from '../../utils/socket';
import { formatHours } from '../../utils/helpers';

const HeaderStat = ({ label, value, tone = 'text-white' }) => (
    <div className="text-center px-3">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
        <div className={`text-xl font-bold leading-tight ${tone}`}>{value}</div>
    </div>
);

const AdminDashboardPage = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';
    const [activeTab, setActiveTab] = useState('dispatch');
    const [stats, setStats] = useState(null);

    const loadStats = useCallback(() => {
        api.get('/analytics/stats').then(res => setStats(res.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        loadStats();
        let timer;
        const schedule = () => { clearTimeout(timer); timer = setTimeout(loadStats, 1000); };
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted'].map(e => socketService.on(e, schedule));
        return () => { clearTimeout(timer); offs.forEach(off => off()); };
    }, [loadStats]);

    const tabs = [
        { key: 'dispatch', label: 'Dispatch Console', desc: 'Prioritised incident queue', icon: Radio },
        { key: 'analytics', label: 'Analytics', desc: 'Performance metrics', icon: Activity },
        ...(isAdmin ? [{ key: 'users', label: 'Users & Roles', desc: 'Responders and access', icon: Users }] : [])
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pb-8 flex flex-col min-h-screen">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-white/10 pb-4">
                    <div>
                        <div className="px-2 py-0.5 mb-2 w-fit rounded bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-mono tracking-widest uppercase">
                            {user?.role} access
                        </div>
                        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                            <Shield className="w-8 h-8 text-blue-500" />
                            Responder <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Command</span>
                        </h1>
                    </div>

                    {stats && (
                        <div className="flex flex-wrap gap-2 px-4 py-2 bg-slate-900/50 border border-white/5 rounded-2xl items-center divide-x divide-white/10">
                            <HeaderStat label="Open" value={stats.openIncidents} tone="text-orange-400" />
                            <HeaderStat label="Unassigned" value={stats.unassignedOpen} tone="text-red-400" />
                            <HeaderStat label="High/critical" value={stats.criticalOpen} tone="text-red-300" />
                            <HeaderStat label="Responders" value={stats.activeResponders ?? '—'} tone="text-emerald-400" />
                            <HeaderStat label="Avg. resolve" value={formatHours(stats.avgResolutionTimeHours)} />
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                    <nav className="lg:w-60 flex lg:flex-col gap-2 overflow-x-auto">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`text-left p-3 lg:p-4 rounded-xl border transition-all whitespace-nowrap ${active
                                        ? 'bg-blue-600/10 border-blue-500/50'
                                        : 'border-transparent hover:bg-white/5 hover:border-white/10'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-5 h-5 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <span className={`font-bold text-sm ${active ? 'text-white' : 'text-gray-400'}`}>{tab.label}</span>
                                    </div>
                                    <div className="hidden lg:block text-xs ml-8 text-gray-500">{tab.desc}</div>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="flex-1 bg-slate-900/50 border border-white/10 rounded-3xl overflow-hidden flex flex-col min-h-[600px]">
                        {activeTab === 'dispatch' && <DispatchConsole />}
                        {activeTab === 'analytics' && <div className="p-4 md:p-6 overflow-auto"><AnalyticsPanel /></div>}
                        {activeTab === 'users' && isAdmin && <UserManagement />}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;
