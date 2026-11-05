import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Play, CheckCircle2, UserCheck, ChevronRight, Inbox, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import useAuthStore from '../../stores/authStore';
import IncidentDetailModal from '../incident/IncidentDetailModal';
import { loadResponders } from '../../utils/responders';
import { OPEN_STATUSES, SEVERITY_COLORS, TYPE_LABELS } from '../../utils/constants';
import { formatRelativeTime, sameId } from '../../utils/helpers';
import { EmptyState, IconButton, SeverityTag, StatusTag, Tabs, cx } from '../ui';
import { EASE } from '../ui/motion';

/**
 * Responder work queue sorted by server-computed priority.
 * Quick actions inline; full controls in the side sheet.
 */
const DispatchConsole = () => {
    const { incidents, fetchIncidents, updateIncidentFields, isLoading } = useIncidentStore();
    const { user } = useAuthStore();
    const [queue, setQueue] = useState('open');
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [responders, setResponders] = useState([]);
    const [busyId, setBusyId] = useState(null);

    useEffect(() => {
        fetchIncidents({ type: '', status: '', severity: '', search: '', sort: '-priority', limit: 200 });
        loadResponders(true).then(setResponders).catch(() => setResponders([]));
    }, [fetchIncidents]);

    const isOpen = (i) => OPEN_STATUSES.includes(i.status);
    const counts = useMemo(() => ({
        open: incidents.filter(isOpen).length,
        unassigned: incidents.filter(i => isOpen(i) && !i.assignedTo).length,
        mine: incidents.filter(i => isOpen(i) && sameId(i.assignedTo, user)).length,
        reported: incidents.filter(i => i.status === 'reported').length,
        closed: incidents.filter(i => !isOpen(i)).length
    }), [incidents, user]);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase().replace(/^#/, '');
        return incidents
            .filter(inc => {
                switch (queue) {
                    case 'open': return isOpen(inc);
                    case 'unassigned': return isOpen(inc) && !inc.assignedTo;
                    case 'mine': return isOpen(inc) && sameId(inc.assignedTo, user);
                    case 'reported': return inc.status === 'reported';
                    case 'closed': return !isOpen(inc);
                    default: return true;
                }
            })
            .filter(inc => !term ||
                inc._id.toLowerCase().includes(term) ||
                inc.title.toLowerCase().includes(term) ||
                (inc.location?.address || '').toLowerCase().includes(term) ||
                inc.type.includes(term))
            .sort((a, b) => (b.priority || 0) - (a.priority || 0) || new Date(b.createdAt) - new Date(a.createdAt));
    }, [incidents, queue, search, user]);

    const quick = async (incident, updates, message) => {
        setBusyId(incident._id);
        const result = await updateIncidentFields(incident._id, updates);
        setBusyId(null);
        if (result.success) toast.success(message);
        else toast.error(result.error);
        if (updates.assignedTo !== undefined) loadResponders(true).then(setResponders).catch(() => {});
    };

    const selected = incidents.find(i => i._id === selectedId);

    return (
        <div>
            <Tabs
                value={queue}
                onChange={setQueue}
                tabs={[
                    { value: 'open', label: 'Open', count: counts.open },
                    { value: 'unassigned', label: 'Unassigned', count: counts.unassigned },
                    { value: 'mine', label: 'Mine', count: counts.mine },
                    { value: 'reported', label: 'Needs verifying', count: counts.reported },
                    { value: 'closed', label: 'Closed', count: counts.closed },
                    { value: 'all', label: 'All' }
                ]}
            />

            <div className="relative my-5 max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, place, type or #ID" aria-label="Search queue" className="field pl-10" />
            </div>

            <div className="hidden grid-cols-[64px_1fr_150px_190px_120px] gap-4 border-b border-line pb-3 text-[12px] font-medium uppercase tracking-wider text-ink-faint lg:grid">
                <span>Priority</span><span>Incident</span><span>State</span><span>Responder</span><span className="text-right">Actions</span>
            </div>

            {filtered.length === 0 ? (
                <EmptyState icon={Inbox} title={isLoading ? 'Loading queue…' : 'Queue is clear'}>
                    {isLoading ? '' : 'No incidents in this queue right now.'}
                </EmptyState>
            ) : (
                <ul>
                    <AnimatePresence initial={false}>
                        {filtered.map((incident) => {
                            const open = isOpen(incident);
                            const busy = busyId === incident._id;
                            const p = incident.priority || 0;
                            return (
                                <motion.li
                                    key={incident._id}
                                    layout="position"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: busy ? 0.5 : 1, y: 0 }}
                                    exit={{ opacity: 0, x: 16 }}
                                    transition={{ duration: 0.35, ease: EASE }}
                                    className="grid grid-cols-[48px_1fr] items-center gap-x-4 gap-y-3 border-b border-line py-4 lg:grid-cols-[64px_1fr_150px_190px_120px]"
                                >
                                    <div className="font-display text-2xl font-semibold tabular-nums" style={{ color: open ? (p >= 25 ? '#D7262E' : p >= 15 ? '#E06B1F' : '#16161A') : '#9C9BA3' }}>
                                        {p.toFixed(0)}
                                    </div>

                                    <button onClick={() => setSelectedId(incident._id)} className="group min-w-0 text-left">
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[incident.severity] }} />
                                            <span className="truncate font-medium group-hover:text-signal">{incident.title}</span>
                                        </div>
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[13px] text-ink-muted">
                                            <span>{TYPE_LABELS[incident.type]}</span>
                                            <span>{formatRelativeTime(incident.createdAt)}</span>
                                            <span className="font-mono text-[11px]">#{incident._id.slice(-6).toUpperCase()}</span>
                                            {incident.location?.address && <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3 w-3" /><span className="truncate">{incident.location.address}</span></span>}
                                            <span>{incident.verificationCount || 0} confirms</span>
                                        </div>
                                    </button>

                                    <div className="col-start-2 flex flex-wrap gap-x-4 gap-y-1 lg:col-start-auto lg:flex-col">
                                        <SeverityTag severity={incident.severity} />
                                        <StatusTag status={incident.status} />
                                    </div>

                                    <select
                                        aria-label="Assign responder"
                                        disabled={busy || !open}
                                        value={incident.assignedTo?._id || ''}
                                        onChange={(e) => quick(incident, { assignedTo: e.target.value || null }, e.target.value ? 'Responder assigned' : 'Assignment cleared')}
                                        className={cx('field col-start-2 py-2 text-sm lg:col-start-auto', !incident.assignedTo && open && 'ring-signal/40')}
                                    >
                                        <option value="">Unassigned</option>
                                        {responders.map(r => <option key={r._id} value={r._id}>{r.name} ({r.activeAssignments})</option>)}
                                    </select>

                                    <div className="col-start-2 flex items-center gap-0.5 lg:col-start-auto lg:justify-end">
                                        {open && !incident.assignedTo && user && (
                                            <IconButton label="Take it" onClick={() => quick(incident, { assignedTo: user._id }, 'Assigned to you')}><UserCheck className="h-4 w-4" /></IconButton>
                                        )}
                                        {['reported', 'verified'].includes(incident.status) && (
                                            <IconButton label="Start response" onClick={() => quick(incident, { status: 'in-progress' }, 'Response started')}><Play className="h-4 w-4" /></IconButton>
                                        )}
                                        {open && (
                                            <IconButton label="Resolve" onClick={() => quick(incident, { status: 'resolved' }, 'Incident resolved')} className="hover:text-sev-low"><CheckCircle2 className="h-4 w-4" /></IconButton>
                                        )}
                                        <IconButton label="Open details" onClick={() => setSelectedId(incident._id)}><ChevronRight className="h-4 w-4" /></IconButton>
                                    </div>
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}

            <IncidentDetailModal incident={selected} isOpen={Boolean(selected)} onClose={() => setSelectedId(null)} />
        </div>
    );
};

export default DispatchConsole;
