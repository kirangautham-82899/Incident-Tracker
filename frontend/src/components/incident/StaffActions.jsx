import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, Play, XCircle, RotateCcw, Trash2, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useIncidentStore from '../../stores/incidentStore';
import { SEVERITY_OPTIONS, OPEN_STATUSES } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';
import { loadResponders } from '../../utils/responders';

/**
 * Responder/admin controls for one incident: status workflow, severity,
 * assignment, internal notes and (admin) delete.
 */
const StaffActions = ({ incident, onDeleted }) => {
    const { user } = useAuthStore();
    const { updateIncidentFields, addNote, deleteIncident } = useIncidentStore();
    const [responders, setResponders] = useState([]);
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        loadResponders().then(setResponders).catch(() => setResponders([]));
    }, []);

    const run = async (fn, successMessage) => {
        setBusy(true);
        const result = await fn();
        setBusy(false);
        if (result.success) {
            if (successMessage) toast.success(successMessage);
        } else {
            toast.error(result.error);
        }
        return result;
    };

    const setStatus = (status, message) => run(() => updateIncidentFields(incident._id, { status }), message);

    const isOpen = OPEN_STATUSES.includes(incident.status);
    const assignedId = incident.assignedTo?._id || incident.assignedTo || '';

    const handleNote = async (e) => {
        e.preventDefault();
        if (!note.trim()) return;
        const result = await run(() => addNote(incident._id, note.trim()), 'Note added');
        if (result.success) setNote('');
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this incident and all its comments? This cannot be undone.')) return;
        const result = await run(() => deleteIncident(incident._id), 'Incident deleted');
        if (result.success && onDeleted) onDeleted();
    };

    const btn = 'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 border';

    return (
        <div className="space-y-4 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-300">
                <Shield className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Responder Controls</h3>
            </div>

            <div className="flex flex-wrap gap-2">
                {incident.status === 'reported' && (
                    <button disabled={busy} onClick={() => setStatus('verified', 'Marked as verified')} className={`${btn} bg-blue-600/20 border-blue-500/30 text-blue-300 hover:bg-blue-600/30`}>
                        <CheckCircle className="w-4 h-4" /> Verify
                    </button>
                )}
                {['reported', 'verified'].includes(incident.status) && (
                    <button disabled={busy} onClick={() => setStatus('in-progress', 'Response started')} className={`${btn} bg-purple-600/20 border-purple-500/30 text-purple-300 hover:bg-purple-600/30`}>
                        <Play className="w-4 h-4" /> Start Response
                    </button>
                )}
                {isOpen && (
                    <button disabled={busy} onClick={() => setStatus('resolved', 'Incident resolved')} className={`${btn} bg-green-600/20 border-green-500/30 text-green-300 hover:bg-green-600/30`}>
                        <CheckCircle className="w-4 h-4" /> Resolve
                    </button>
                )}
                {isOpen && (
                    <button disabled={busy} onClick={() => setStatus('false', 'Marked as false report')} className={`${btn} bg-gray-600/20 border-gray-500/30 text-gray-300 hover:bg-gray-600/30`}>
                        <XCircle className="w-4 h-4" /> False Report
                    </button>
                )}
                {!isOpen && (
                    <button disabled={busy} onClick={() => setStatus('verified', 'Incident re-opened')} className={`${btn} bg-yellow-600/20 border-yellow-500/30 text-yellow-300 hover:bg-yellow-600/30`}>
                        <RotateCcw className="w-4 h-4" /> Re-open
                    </button>
                )}
                {user?.role === 'admin' && (
                    <button disabled={busy} onClick={handleDelete} className={`${btn} bg-red-600/20 border-red-500/30 text-red-300 hover:bg-red-600/30 ml-auto`}>
                        <Trash2 className="w-4 h-4" /> Delete
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-gray-400 space-y-1">
                    <span className="font-semibold">Severity</span>
                    <select
                        value={incident.severity}
                        disabled={busy}
                        onChange={(e) => run(() => updateIncidentFields(incident._id, { severity: e.target.value }), 'Severity updated')}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm"
                    >
                        {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </label>
                <label className="text-xs text-gray-400 space-y-1">
                    <span className="font-semibold">Assigned responder</span>
                    <select
                        value={assignedId}
                        disabled={busy}
                        onChange={(e) => run(() => updateIncidentFields(incident._id, { assignedTo: e.target.value || null }), e.target.value ? 'Responder assigned' : 'Assignment cleared')}
                        className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm"
                    >
                        <option value="">Unassigned</option>
                        {responders.map(r => (
                            <option key={r._id} value={r._id}>
                                {r.name} ({r.role}, {r.activeAssignments} active)
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-400">Internal notes (staff only)</h4>
                {incident.adminNotes?.length > 0 && (
                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                        {incident.adminNotes.slice().reverse().map((n) => (
                            <li key={n._id} className="text-sm p-2 rounded-lg bg-slate-900/60 border border-white/5">
                                <span className="text-gray-200">{n.note}</span>
                                <div className="text-[11px] text-gray-500 mt-1">
                                    {n.adminName || 'Staff'} · {formatRelativeTime(n.timestamp)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                <form onSubmit={handleNote} className="flex gap-2">
                    <input
                        value={note}
                        maxLength={500}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Unit 4 dispatched, ETA 10 min"
                        className="flex-1 px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500"
                    />
                    <button type="submit" disabled={busy || !note.trim()} aria-label="Add note" className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 rounded-lg text-white">
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StaffActions;
