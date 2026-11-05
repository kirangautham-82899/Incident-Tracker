import React, { useEffect, useState } from 'react';
import { ClipboardList, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import IncidentCard from './IncidentCard';
import Loading from '../common/Loading';
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';

const selectClass = 'px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-gray-200 focus:border-blue-500 outline-none';

const IncidentList = () => {
    const { incidents, total, filters, setFilters, fetchIncidents, verifyIncident, isLoading, hasLoaded, error } = useIncidentStore();
    const [searchText, setSearchText] = useState(filters.search);

    // Refetch whenever a filter changes
    useEffect(() => {
        fetchIncidents();
    }, [filters, fetchIncidents]);

    // Debounce the free-text search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchText !== filters.search) setFilters({ search: searchText });
        }, 400);
        return () => clearTimeout(timer);
    }, [searchText, filters.search, setFilters]);

    const handleVerify = async (id) => {
        const result = await verifyIncident(id);
        if (result.success) {
            toast.success('Thanks for confirming this incident');
        } else {
            toast.error(result.error || 'Failed to verify');
        }
    };

    const hasFilters = filters.type || filters.status || filters.severity || filters.search;
    const clearFilters = () => {
        setSearchText('');
        setFilters({ type: '', status: '', severity: '', search: '' });
    };

    // Socket events add new incidents regardless of filters; hide ones that don't match
    const visible = incidents.filter(inc =>
        (!filters.type || inc.type === filters.type) &&
        (!filters.severity || inc.severity === filters.severity) &&
        (!filters.status || (filters.status === 'open'
            ? ['reported', 'verified', 'in-progress'].includes(inc.status)
            : inc.status === filters.status))
    );

    return (
        <div className="space-y-4 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Search title, description, address or ID"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <select aria-label="Filter by type" value={filters.type} onChange={(e) => setFilters({ type: e.target.value })} className={selectClass}>
                    <option value="">All types</option>
                    {INCIDENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select aria-label="Filter by status" value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} className={selectClass}>
                    <option value="">All statuses</option>
                    <option value="open">Open (not closed)</option>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select aria-label="Filter by severity" value={filters.severity} onChange={(e) => setFilters({ severity: e.target.value })} className={selectClass}>
                    <option value="">All severities</option>
                    {SEVERITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select aria-label="Sort" value={filters.sort} onChange={(e) => setFilters({ sort: e.target.value })} className={selectClass}>
                    <option value="-createdAt">Newest first</option>
                    <option value="-priority">Highest priority</option>
                    <option value="-verificationCount">Most confirmed</option>
                    <option value="createdAt">Oldest first</option>
                </select>
                {hasFilters && (
                    <button onClick={clearFilters} className="px-3 py-2 text-sm text-gray-400 hover:text-white flex items-center gap-1">
                        <X className="w-4 h-4" /> Clear
                    </button>
                )}
                <button
                    onClick={() => fetchIncidents()}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Refresh"
                    aria-label="Refresh"
                >
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="text-xs text-gray-500">
                Showing {visible.length} of {total} incident{total === 1 ? '' : 's'}
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                    {error}
                </div>
            )}

            {!hasLoaded && isLoading ? (
                <Loading text="Loading incidents..." />
            ) : visible.length === 0 ? (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-white/5">
                    <div className="inline-flex p-4 rounded-full bg-slate-700/50 mb-4">
                        <ClipboardList className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                        {hasFilters ? 'No incidents match these filters' : 'No incidents reported yet'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                        {hasFilters ? 'Try clearing the filters.' : 'New reports will appear here in real time.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {visible.map((incident) => (
                        <IncidentCard key={incident._id} incident={incident} onVerify={handleVerify} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default IncidentList;
