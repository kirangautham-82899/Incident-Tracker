import React, { useEffect, useMemo, useState } from 'react';
import { Search, ShieldCheck, Clock, MapPin, Eye, Play, CheckCircle, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import useAuthStore from '../../stores/authStore';
import IncidentDetailModal from '../incident/IncidentDetailModal';
import { loadResponders } from '../../utils/responders';
import { STATUS_BADGE, STATUS_LABELS, SEVERITY_BADGE, OPEN_STATUSES } from '../../utils/constants';
import { formatRelativeTime, sameId } from '../../utils/helpers';

const QUEUES = [
    { key: 'open', label: 'Open queue' },
    { key: 'unassigned', label: 'Unassigned' },
    { key: 'mine', label: 'Assigned to me' },
    { key: 'reported', label: 'Needs verification' },
    { key: 'closed', label: 'Closed' },
    { key: 'all', label: 'All' }
];

/**
 * Responder work queue sorted by server-computed priority.
 * Quick actions here; full controls in the detail modal.
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

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return incidents
            .filter(inc => {
                const open = OPEN_STATUSES.includes(inc.status);
                switch (queue) {
                    case 'open': return open;
                    case 'unassigned': return open && !inc.assignedTo;
                    case 'mine': return open && sameId(inc.assignedTo, user);
                    case 'reported': return inc.status === 'reported';
                    case 'closed': return !open;
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
        if (updates.assignedTo) loadResponders(true).then(setResponders).catch(() => {});
    };

    const counts = useMemo(() => ({
        open: incidents.filter(i => OPEN_STATUSES.includes(i.status)).length,
        unassigned: incidents.filter(i => OPEN_STATUSES.includes(i.status) && !i.assignedTo).length,
        mine: incidents.filter(i => OPEN_STATUSES.includes(i.status) && sameId(i.assignedTo, user)).length,
        reported: incidents.filter(i => i.status === 'reported').length
    }), [incidents, user]);

    const selected = incidents.find(i => i._id === selectedId);

    return (
        <div className="h-full flex flex-col p-4 md:p-6 min-h-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg border border-white/10">
                    {QUEUES.map(q => (
                        <button
                            key={q.key}
                            onClick={() => setQueue(q.key)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${queue === q.key ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {q.label}{counts[q.key] !== undefined ? ` (${counts[q.key]})` : ''}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search ID, title, address, type"
                        className="bg-slate-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none w-full xl:w-72"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-slate-900/50 min-h-[300px]">
                <table className="w-full text-left border-collapse min-w-[860px]">
                    <thead className="sticky top-0 bg-slate-900 z-10">
                        <tr className="text-xs text-gray-500">
                            <th className="p-3 border-b border-white/10">Priority</th>
                            <th className="p-3 border-b border-white/10">Incident</th>
                            <th className="p-3 border-b border-white/10">Severity / Status</th>
                            <th className="p-3 border-b border-white/10">Confirms</th>
                            <th className="p-3 border-b border-white/10">Responder</th>
                            <th className="p-3 border-b border-white/10 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.map((incident) => {
                            const open = OPEN_STATUSES.includes(incident.status);
                            const busy = busyId === incident._id;
                            return (
                                <tr key={incident._id} className="hover:bg-white/5 transition-colors align-top">
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${incident.priority >= 25 ? 'bg-red-500 animate-pulse' : incident.priority >= 15 ? 'bg-orange-500' : open ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                                            <span className="font-mono text-sm text-gray-200">{(incident.priority || 0).toFixed(1)}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 max-w-[280px]">
                                        <div className="text-sm font-semibold text-white truncate">{incident.title}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                            <span className="uppercase font-bold text-gray-400">{incident.type}</span>
                                            <span>·</span>
                                            <Clock className="w-3 h-3" /> {formatRelativeTime(incident.createdAt)}
                                            <span>·</span>
                                            <span className="font-mono">#{incident._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 truncate">
                                            <MapPin className="w-3 h-3 shrink-0" /> {incident.location?.address || 'Pinned location'}
                                        </div>
                                    </td>
                                    <td className="p-3 space-y-1">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${SEVERITY_BADGE[incident.severity]}`}>{incident.severity}</span>
                                        <br />
                                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${STATUS_BADGE[incident.status]}`}>{STATUS_LABELS[incident.status]}</span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1 text-emerald-400">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="font-bold">{incident.verificationCount || 0}</span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <select
                                            aria-label="Assign responder"
                                            disabled={busy || !open}
                                            value={incident.assignedTo?._id || ''}
                                            onChange={(e) => quick(incident, { assignedTo: e.target.value || null }, e.target.value ? 'Responder assigned' : 'Assignment cleared')}
                                            className="w-40 px-2 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50"
                                        >
                                            <option value="">Unassigned</option>
                                            {responders.map(r => (
                                                <option key={r._id} value={r._id}>{r.name} ({r.activeAssignments})</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-end gap-1.5">
                                            {open && !incident.assignedTo && user && (
                                                <button disabled={busy} onClick={() => quick(incident, { assignedTo: user._id }, 'Assigned to you')} title="Take this incident" className="p-2 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 disabled:opacity-50">
                                                    <UserCheck className="w-4 h-4" />
                                                </button>
                                            )}
                                            {['reported', 'verified'].includes(incident.status) && (
                                                <button disabled={busy} onClick={() => quick(incident, { status: 'in-progress' }, 'Response started')} title="Start response" className="p-2 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 disabled:opacity-50">
                                                    <Play className="w-4 h-4" />
                                                </button>
                                            )}
                                            {open && (
                                                <button disabled={busy} onClick={() => quick(incident, { status: 'resolved' }, 'Incident resolved')} title="Resolve" className="p-2 rounded-lg bg-green-600/20 border border-green-500/30 text-green-300 hover:bg-green-600/30 disabled:opacity-50">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => setSelectedId(incident._id)} title="Open details" className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <div className="p-12 text-center text-gray-500 text-sm">
                        {isLoading ? 'Loading...' : 'No incidents in this queue.'}
                    </div>
                )}
            </div>

            <IncidentDetailModal incident={selected} isOpen={Boolean(selected)} onClose={() => setSelectedId(null)} />
        </div>
    );
};

export default DispatchConsole;
