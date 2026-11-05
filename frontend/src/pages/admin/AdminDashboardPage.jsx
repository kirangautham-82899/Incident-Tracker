import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import DispatchConsole from '../../components/admin/DispatchConsole';
import UserManagement from '../../components/admin/UserManagement';
import AnalyticsPanel from '../../components/analytics/AnalyticsPanel';
import useAuthStore from '../../stores/authStore';
import api from '../../utils/api';
import socketService from '../../utils/socket';
import { formatHours } from '../../utils/helpers';
import { Container, PageHeader, RoleTag, Stat, StatRow, Tabs } from '../../components/ui';
import { AnimatedNumber, EASE, PageTransition } from '../../components/ui/motion';

const AdminDashboardPage = () => {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'admin';
    const [tab, setTab] = useState('dispatch');
    const [stats, setStats] = useState(null);

    const loadStats = useCallback(() => {
        api.get('/analytics/stats').then(res => setStats(res.data.data)).catch(() => {});
    }, []);

    useEffect(() => {
        loadStats();
        let timer;
        const schedule = () => { clearTimeout(timer); timer = setTimeout(loadStats, 800); };
        const offs = ['incident_created', 'incident_updated', 'incident_verified', 'incident_deleted', 'data_refresh'].map(e => socketService.on(e, schedule));
        return () => { clearTimeout(timer); offs.forEach(off => off()); };
    }, [loadStats]);

    const tabs = [
        { value: 'dispatch', label: 'Dispatch queue' },
        { value: 'analytics', label: 'Analytics' },
        ...(isAdmin ? [{ value: 'users', label: 'Users & roles' }] : [])
    ];

    return (
        <PageTransition className="pb-20">
            <Container>
                <PageHeader
                    eyebrow={<span className="flex items-center gap-3">Command console <RoleTag role={user?.role} /></span>}
                    title="Respond by"
                    accent="priority."
                    description="Highest-priority open incidents first. Priority combines type, severity, community confirmations and time waiting."
                />

                <StatRow className="mb-10">
                    <Stat label="Open" value={<AnimatedNumber value={stats?.openIncidents ?? 0} />} />
                    <Stat label="Unassigned" value={<AnimatedNumber value={stats?.unassignedOpen ?? 0} />} tone={stats?.unassignedOpen ? '#E5402A' : undefined} hint="Need a responder" />
                    <Stat label="High / critical" value={<AnimatedNumber value={stats?.criticalOpen ?? 0} />} tone="#D7262E" />
                    <Stat label="Avg. resolve" value={formatHours(stats?.avgResolutionTimeHours)} hint={stats?.activeResponders !== undefined ? `${stats.activeResponders} active responders` : undefined} />
                </StatRow>

                <Tabs tabs={tabs} value={tab} onChange={setTab} className="mb-6" />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, ease: EASE }}
                    >
                        {tab === 'dispatch' && <DispatchConsole />}
                        {tab === 'analytics' && <AnalyticsPanel />}
                        {tab === 'users' && isAdmin && <UserManagement />}
                    </motion.div>
                </AnimatePresence>
            </Container>
        </PageTransition>
    );
};

export default AdminDashboardPage;
