import React, { useEffect, useState } from 'react';
import { CheckCircle2, Play, XCircle, RotateCcw, Trash2, ArrowUp, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useIncidentStore from '../../stores/incidentStore';
import { SEVERITY_OPTIONS, SEVERITY_COLORS, OPEN_STATUSES } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/helpers';
import { loadResponders } from '../../utils/responders';
import { Button, Field, Segmented, Select } from '../ui';

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
        if (result.success) { if (successMessage) toast.success(successMessage); }
        else toast.error(result.error);
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

    return (
        <section className="rounded-2xl bg-paper-deep/80 px-5 py-7 sm:px-6">
            <h3 className="mb-6 flex items-center gap-2 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-ink-soft">
                <Shield className="h-3.5 w-3.5" /> Responder controls
            </h3>

            <div className="flex flex-wrap gap-2">
                {incident.status === 'reported' && (
                    <Button size="sm" variant="outline" loading={busy} onClick={() => setStatus('verified', 'Marked as verified')}>
                        <CheckCircle2 className="h-4 w-4" /> Verify
                    </Button>
                )}
                {['reported', 'verified'].includes(incident.status) && (
                    <Button size="sm" variant="primary" disabled={busy} onClick={() => setStatus('in-progress', 'Response started')}>
                        <Play className="h-4 w-4" /> Start response
                    </Button>
                )}
                {isOpen && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus('resolved', 'Incident resolved')} className="text-sev-low">
                        <CheckCircle2 className="h-4 w-4" /> Resolve
                    </Button>
                )}
                {isOpen && (
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setStatus('false', 'Marked as false report')}>
                        <XCircle className="h-4 w-4" /> False report
                    </Button>
                )}
                {!isOpen && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => setStatus('verified', 'Incident re-opened')}>
                        <RotateCcw className="h-4 w-4" /> Re-open
                    </Button>
                )}
                {user?.role === 'admin' && (
                    <Button size="sm" variant="danger" disabled={busy} onClick={handleDelete} className="ml-auto">
                        <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                )}
            </div>

            <div className="mt-8 space-y-6">
                <Field label="Severity">
                    <Segmented
                        options={SEVERITY_OPTIONS}
                        value={incident.severity}
                        colorFor={(v) => SEVERITY_COLORS[v]}
                        onChange={(severity) => severity !== incident.severity && run(() => updateIncidentFields(incident._id, { severity }), 'Severity updated')}
                    />
                </Field>
                <Field label="Assigned responder" htmlFor="assign">
                    <Select
                        id="assign"
                        value={assignedId}
                        disabled={busy}
                        onChange={(e) => run(() => updateIncidentFields(incident._id, { assignedTo: e.target.value || null }), e.target.value ? 'Responder assigned' : 'Assignment cleared')}
                    >
                        <option value="">Unassigned</option>
                        {responders.map(r => (
                            <option key={r._id} value={r._id}>{r.name} · {r.role} · {r.activeAssignments} active</option>
                        ))}
                    </Select>
                </Field>

                <div>
                    <div className="mb-3 text-[13px] font-medium text-ink-soft">Internal notes <span className="text-ink-faint">· staff only</span></div>
                    {incident.adminNotes?.length > 0 && (
                        <ul className="mb-3 space-y-3 border-l border-line-strong pl-4">
                            {incident.adminNotes.slice().reverse().map((n) => (
                                <li key={n._id} className="text-sm">
                                    <p className="text-ink">{n.note}</p>
                                    <p className="mt-0.5 text-[12px] text-ink-faint">{n.adminName || 'Staff'} · {formatRelativeTime(n.timestamp)}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                    <form onSubmit={handleNote} className="relative">
                        <input
                            value={note}
                            maxLength={500}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Unit 4 dispatched, ETA 10 min"
                            aria-label="Internal note"
                            className="field rounded-full bg-white py-3 pl-5 pr-14"
                        />
                        <button type="submit" disabled={busy || !note.trim()} aria-label="Add note"
                            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-paper transition-all hover:scale-105 disabled:opacity-20">
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default StaffActions;
