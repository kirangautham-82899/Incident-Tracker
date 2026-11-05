import React, { useEffect, useState } from 'react';
import { Plus, Map as MapIcon, FileDown } from 'lucide-react';
import IncidentList from '../components/incident/IncidentList';
import LiveChat from '../components/common/LiveChat';
import SafetyCheck from '../components/common/SafetyCheck';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import socketService, { SOCKET_ENABLED } from '../utils/socket';
import { Button, Container, Dot, PageHeader, Stat, StatRow } from '../components/ui';
import { AnimatedNumber, PageTransition } from '../components/ui/motion';

const DashboardPage = () => {
    const { user, isAuthenticated } = useAuthStore();
    const [stats, setStats] = useState(null);

    // Headline numbers come from the server so they cover all incidents
    useEffect(() => {
        let timer;
        const load = () => api.get('/analytics/stats').then(res => setStats(res.data.data)).catch(() => {});
        const schedule = () => { clearTimeout(timer); timer = setTimeout(load, 800); };
        load();
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted', 'data_refresh'].map(e => socketService.on(e, schedule));
        return () => { clearTimeout(timer); offs.forEach(off => off()); };
    }, []);

    const exportPdf = async () => {
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
    };

    return (
        <PageTransition>
            <Container>
                <PageHeader
                    eyebrow={<span className="flex items-center gap-2"><Dot color="#E5402A" pulse /> {SOCKET_ENABLED ? 'Live' : 'Auto-refreshing'}</span>}
                    title="Incident"
                    accent="feed."
                    description={isAuthenticated
                        ? `Welcome back, ${user?.name?.split(' ')[0]}. Confirm what you can see nearby, and follow incidents to resolution.`
                        : 'Everything reported in the community, newest first. Log in to confirm reports and post updates.'}
                    actions={
                        <>
                            <Button variant="ghost" size="sm" onClick={exportPdf}><FileDown className="h-4 w-4" /> Export</Button>
                            <Button variant="outline" to="/map"><MapIcon className="h-4 w-4" /> Map</Button>
                            <Button variant="signal" to="/report"><Plus className="h-4 w-4" /> Report</Button>
                        </>
                    }
                />

                <StatRow>
                    <Stat label="Open" value={<AnimatedNumber value={stats?.openIncidents ?? 0} />} hint={stats ? `${stats.unassignedOpen} awaiting a responder` : ' '} />
                    <Stat label="High / critical" value={<AnimatedNumber value={stats?.criticalOpen ?? 0} />} tone="#D7262E" hint="Open and urgent" />
                    <Stat label="Resolved" value={<AnimatedNumber value={stats?.resolvedIncidents ?? 0} />} tone="#2F9E6E" hint="All time" />
                    <Stat label="Last 24 hours" value={<AnimatedNumber value={stats?.recentIncidents ?? 0} />} hint="New reports" />
                </StatRow>

                <div className="grid gap-12 pt-10 lg:grid-cols-[1fr_300px]">
                    <IncidentList />
                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <SafetyCheck />
                    </aside>
                </div>
            </Container>

            {SOCKET_ENABLED && <LiveChat />}
        </PageTransition>
    );
};

export default DashboardPage;
