import React, { useEffect, useMemo, useState } from 'react';
import { Map } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import IncidentMap from '../components/map/IncidentMap';
import useIncidentStore from '../stores/incidentStore';
import { INCIDENT_TYPE_OPTIONS, OPEN_STATUSES } from '../utils/constants';

const MapPage = () => {
    const { incidents, fetchIncidents } = useIncidentStore();
    const [showClosed, setShowClosed] = useState(false);
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        // Map always shows everything, independent of the feed filters
        fetchIncidents({ type: '', status: '', severity: '', search: '', limit: 200 });
    }, [fetchIncidents]);

    const visible = useMemo(() => incidents.filter(i =>
        (showClosed || OPEN_STATUSES.includes(i.status)) &&
        (!typeFilter || i.type === typeFilter)
    ), [incidents, showClosed, typeFilter]);

    const open = incidents.filter(i => OPEN_STATUSES.includes(i.status));

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="relative pt-24 px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto pb-8">
                <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Map className="w-8 h-8 text-blue-500" />
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                                Incident <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Map</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 text-sm">Live locations with clustering and a severity heat map. Click a marker for details.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            aria-label="Filter by type"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-sm"
                        >
                            <option value="">All types</option>
                            {INCIDENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
                            Show resolved / false
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                        <div className="text-2xl font-black text-blue-400">{open.length}</div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Open incidents</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                        <div className="text-2xl font-black text-orange-400">
                            {open.filter(i => i.severity === 'critical' || i.severity === 'high').length}
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">High / critical open</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                        <div className="text-2xl font-black text-green-400">
                            {incidents.filter(i => i.status === 'resolved').length}
                        </div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</div>
                    </div>
                </div>

                <div className="h-[calc(100vh-360px)] min-h-[500px]">
                    <IncidentMap incidents={visible} />
                </div>

                <div className="mt-6 p-5 rounded-2xl bg-slate-900/50 border border-white/10">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Legend</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {INCIDENT_TYPE_OPTIONS.map(item => (
                            <div key={item.value} className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full border-2 border-white" style={{ background: item.color }} />
                                <span className="text-sm text-gray-300">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">Bigger pins mean higher severity; faded pins are closed incidents.</p>
                </div>
            </div>
        </div>
    );
};

export default MapPage;
