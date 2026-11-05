import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Inbox, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import IncidentRow from './IncidentCard';
import IncidentDetailModal from './IncidentDetailModal';
import { Button, EmptyState, IconButton, Select, Spinner, Tabs } from '../ui';
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS, OPEN_STATUSES } from '../../utils/constants';

const STATUS_TABS = [
    { value: '', label: 'All' },
    { value: 'open', label: 'Open' },
    { value: 'reported', label: 'Needs confirming' },
    { value: 'in-progress', label: 'In progress' },
    { value: 'resolved', label: 'Resolved' }
];

const IncidentList = () => {
    const { incidents, total, filters, setFilters, fetchIncidents, verifyIncident, isLoading, hasLoaded, error } = useIncidentStore();
    const [searchText, setSearchText] = useState(filters.search);
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        fetchIncidents();
    }, [filters, fetchIncidents]);

    // Debounced free-text search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText !== filters.search) setFilters({ search: searchText });
        }, 350);
        return () => clearTimeout(timer);
    }, [searchText, filters.search, setFilters]);

    const handleVerify = async (id) => {
        const result = await verifyIncident(id);
        if (result.success) toast.success('Thanks for confirming');
        else toast.error(result.error || 'Failed to confirm');
    };

    const hasFilters = filters.type || filters.status || filters.severity || filters.search;
    const clearFilters = () => {
        setSearchText('');
        setFilters({ type: '', status: '', severity: '', search: '' });
    };

    // Live socket/poll updates add incidents regardless of filters: hide non-matching ones
    const visible = incidents.filter(inc =>
        (!filters.type || inc.type === filters.type) &&
        (!filters.severity || inc.severity === filters.severity) &&
        (!filters.status || (filters.status === 'open' ? OPEN_STATUSES.includes(inc.status) : inc.status === filters.status))
    );
    const selected = incidents.find(i => i._id === selectedId);

    return (
        <div>
            <Tabs tabs={STATUS_TABS} value={filters.status} onChange={(status) => setFilters({ status })} />

            <div className="flex flex-wrap items-center gap-3 py-5">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search by title, place or #ID"
                        aria-label="Search incidents"
                        className="field pl-10"
                    />
                </div>
                <Select aria-label="Type" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })} className="w-auto">
                    <option value="">All types</option>
                    {INCIDENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
                <Select aria-label="Severity" value={filters.severity} onChange={(e) => setFilters({ severity: e.target.value })} className="w-auto">
                    <option value="">Any severity</option>
                    {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
                <Select aria-label="Sort" value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} className="w-auto">
                    <option value="-createdAt">Newest</option>
                    <option value="-priority">Most urgent</option>
                    <option value="-verificationCount">Most confirmed</option>
                    <option value="createdAt">Oldest</option>
                </Select>
                <IconButton label="Refresh" onClick={() => fetchIncidents()}>
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </IconButton>
            </div>

            <div className="flex items-center justify-between border-b border-line pb-3 text-[13px] text-ink-muted">
                <span>{visible.length} of {total} incident{total === 1 ? '' : 's'}</span>
                {hasFilters && (
                    <button onClick={clearFilters} className="flex items-center gap-1 font-medium text-ink-soft hover:text-ink">
                        <X className="h-3.5 w-3.5" /> Clear filters
                    </button>
                )}
            </div>

            {error && <p className="py-4 text-sm text-sev-critical">{error}</p>}

            {!hasLoaded && isLoading ? (
                <Spinner label="Loading incidents" />
            ) : visible.length === 0 ? (
                <EmptyState
                    icon={Inbox}
                    title={hasFilters ? 'Nothing matches these filters' : 'No incidents reported yet'}
                    action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear filters</Button> : <Button to="/report">Report an incident</Button>}
                >
                    {hasFilters ? 'Try a different status or clear the search.' : 'New reports appear here automatically.'}
                </EmptyState>
            ) : (
                <ul>
                    <AnimatePresence initial={false}>
                        {visible.map(incident => (
                            <IncidentRow key={incident._id} incident={incident} onOpen={(i) => setSelectedId(i._id)} onVerify={handleVerify} />
                        ))}
                    </AnimatePresence>
                </ul>
            )}

            <IncidentDetailModal incident={selected} isOpen={Boolean(selected)} onClose={() => setSelectedId(null)} />
        </div>
    );
};

export default IncidentList;
