import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, User, Shield, MapPin, AlertCircle, Activity, FileText, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/layout/Navbar';
import IncidentList from '../components/incident/IncidentList';
import LiveChat from '../components/common/LiveChat';
import SafetyCheck from '../components/common/SafetyCheck';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import socketService, { SOCKET_ENABLED } from '../utils/socket';
import { isStaff } from '../utils/constants';

const StatsWidget = ({ label, value, color }) => (
    <div className="flex flex-col items-center justify-center min-w-[72px] p-2 rounded bg-white/5 border border-white/5">
        <span className={`text-xl font-bold font-mono ${color}`}>{value ?? '–'}</span>
        <span className="text-[9px] text-slate-400 uppercase tracking-wider">{label}</span>
    </div>
);

const DashboardPage = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState(null);

    // Header numbers come from the server so they cover all incidents, not just the loaded page
    useEffect(() => {
        let timer;
        const load = () => api.get('/analytics/stats').then(res => setStats(res.data.data)).catch(() => {});
        const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 1000); };
        load();
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted', 'data_refresh'].map(e => socketService.on(e, schedule));
        return () => { clearTimeout(timer); offs.forEach(off => off()); };
    }, []);

    const quickActions = [
        { title: 'Report Incident', icon: AlertCircle, link: '/report', color: 'text-red-400' },
        { title: 'Live Map', icon: MapPin, link: '/map', color: 'text-emerald-400' },
        { title: 'Analytics', icon: BarChart3, link: '/analytics', color: 'text-blue-400' },
        { title: 'Export Summary (PDF)', icon: FileText, action: 'export', color: 'text-cyan-400' },
        { title: 'Share Dashboard', icon: Share2, action: 'share', color: 'text-pink-400' },
        { title: 'My Profile', icon: User, link: '/profile', color: 'text-purple-400', requiresAuth: true },
        { title: 'Responder Console', icon: Shield, link: '/admin', color: 'text-amber-400', staffOnly: true }
    ].filter(a => (!a.requiresAuth || isAuthenticated) && (!a.staffOnly || isStaff(user)));

    const handleAction = async (action) => {
        if (action === 'export') {
            const [{ generateDashboardPDF }, res] = await Promise.all([
                import('../utils/pdfGenerator'),
                api.get('/incidents', { params: { status: 'open', sort: '-priority', limit: 50 } })
            ]);
            generateDashboardPDF({
                total: stats?.totalIncidents ?? 0,
                active: stats?.openIncidents ?? 0,
                resolved: stats?.resolvedIncidents ?? 0,
                critical: stats?.criticalOpen ?? 0
            }, res.data.data);
        } else if (action === 'share') {
            const url = window.location.href;
            if (navigator.share) {
                navigator.share({ title: 'Incident Tracker', text: `${stats?.openIncidents ?? 0} open incidents right now`, url }).catch(() => {});
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Dashboard link copied');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#050b14] text-slate-300">
            <Navbar />

            <div className="relative pt-24 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-xs text-blue-300 font-mono">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            LIVE
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                            Incident <span className="text-slate-500">Feed</span>
                        </h1>
                        <p className="text-sm text-slate-400 mt-1">
                            {isAuthenticated ? `Welcome back, ${user?.name}.` : 'Browse live incidents. Log in to confirm reports and comment.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <StatsWidget label="Open" value={stats?.openIncidents} color="text-blue-400" />
                        <StatsWidget label="High/Crit." value={stats?.criticalOpen} color="text-red-400" />
                        <StatsWidget label="Resolved" value={stats?.resolvedIncidents} color="text-emerald-400" />
                        <StatsWidget label="Last 24h" value={stats?.recentIncidents} color="text-yellow-400" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-9">
                        <div className="rounded-xl border border-white/5 bg-slate-900/20 overflow-hidden min-h-[500px]">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-400" />
                                    Live incident feed
                                </h2>
                                <span className="text-[10px] font-mono text-slate-500">{SOCKET_ENABLED ? 'UPDATES IN REAL TIME' : 'AUTO-REFRESHES EVERY 20S'}</span>
                            </div>
                            <IncidentList />
                        </div>
                    </div>

                    <aside className="lg:col-span-3 space-y-4">
                        <SafetyCheck className="w-full" />

                        <div className="grid grid-cols-1 gap-2">
                            {quickActions.map((action) => {
                                const Icon = action.icon;
                                const classes = 'group flex items-center gap-4 p-3 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800/60 hover:border-white/10 transition-all w-full text-left';
                                const content = (
                                    <>
                                        <div className="p-2 rounded bg-white/5">
                                            <Icon className={`w-5 h-5 ${action.color}`} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">{action.title}</span>
                                    </>
                                );
                                return action.action ? (
                                    <button key={action.title} onClick={() => handleAction(action.action)} className={classes}>{content}</button>
                                ) : (
                                    <Link key={action.title} to={action.link} className={classes}>{content}</Link>
                                );
                            })}
                        </div>
                    </aside>
                </div>
            </div>

            {SOCKET_ENABLED && <LiveChat />}
        </div>
    );
};

export default DashboardPage;
