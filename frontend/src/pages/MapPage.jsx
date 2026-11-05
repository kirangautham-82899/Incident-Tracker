import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Flame, SlidersHorizontal, X } from 'lucide-react';
import IncidentMap from '../components/map/IncidentMap';
import useIncidentStore from '../stores/incidentStore';
import { INCIDENT_TYPE_OPTIONS, OPEN_STATUSES } from '../utils/constants';
import { cx } from '../components/ui';
import { AnimatedNumber, EASE } from '../components/ui/motion';

const Toggle = ({ checked, onChange, children }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="flex w-full items-center justify-between py-2 text-sm text-ink-soft"
    >
        {children}
        <span className={cx('relative h-5 w-9 rounded-full transition-colors', checked ? 'bg-ink' : 'bg-line-strong')}>
            <motion.span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow"
                animate={{ left: checked ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            />
        </span>
    </button>
);

const MapPage = () => {
    const { incidents, fetchIncidents } = useIncidentStore();
    const [showClosed, setShowClosed] = useState(false);
    const [heat, setHeat] = useState(false);
    const [types, setTypes] = useState([]); // empty = all
    const [panelOpen, setPanelOpen] = useState(true);

    useEffect(() => {
        // The map always shows everything, independent of the feed filters
        fetchIncidents({ type: '', status: '', severity: '', search: '', limit: 200 });
    }, [fetchIncidents]);

    const visible = useMemo(() => incidents.filter(i =>
        (showClosed || OPEN_STATUSES.includes(i.status)) && (types.length === 0 || types.includes(i.type))
    ), [incidents, showClosed, types]);

    const open = incidents.filter(i => OPEN_STATUSES.includes(i.status));
    const urgent = open.filter(i => i.severity === 'critical' || i.severity === 'high').length;
    const toggleType = (t) => setTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-[calc(100vh-4rem)] overflow-hidden"
        >
            <IncidentMap incidents={visible} showHeatMap={heat} />

            <AnimatePresence>
                {panelOpen ? (
                    <motion.aside
                        key="panel"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="absolute bottom-4 left-4 right-4 z-[1000] max-h-[60vh] overflow-y-auto rounded-2xl bg-paper/90 p-5 shadow-[0_24px_60px_-24px_rgba(22,22,26,0.45)] ring-1 ring-line backdrop-blur-xl sm:bottom-auto sm:right-auto sm:top-4 sm:w-80 sm:max-h-[calc(100%-2rem)]"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="eyebrow">Incident map</p>
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                                    <AnimatedNumber value={open.length} /> <span className="font-serif font-normal italic text-ink-soft">open</span>
                                </h1>
                                <p className="mt-0.5 text-[13px] text-ink-muted">{urgent} high or critical</p>
                            </div>
                            <button onClick={() => setPanelOpen(false)} aria-label="Hide panel" className="rounded-full p-1.5 text-ink-muted hover:bg-paper-deep hover:text-ink">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-5 border-t border-line pt-4">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="eyebrow">Types</span>
                                {types.length > 0 && <button onClick={() => setTypes([])} className="text-[12px] font-medium text-ink-muted hover:text-ink">Show all</button>}
                            </div>
                            <ul className="space-y-0.5">
                                {INCIDENT_TYPE_OPTIONS.map(t => {
                                    const active = types.length === 0 || types.includes(t.value);
                                    const count = open.filter(i => i.type === t.value).length;
                                    return (
                                        <li key={t.value}>
                                            <button
                                                onClick={() => toggleType(t.value)}
                                                className={cx('flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-opacity hover:bg-paper-deep', !active && 'opacity-40')}
                                                aria-pressed={types.includes(t.value)}
                                            >
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                                                <span className="flex-1 text-left">{t.label}</span>
                                                <span className="font-mono text-[12px] tabular-nums text-ink-faint">{count}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="mt-4 border-t border-line pt-3">
                            <Toggle checked={heat} onChange={setHeat}><span className="flex items-center gap-2"><Flame className="h-4 w-4" /> Heat map</span></Toggle>
                            <Toggle checked={showClosed} onChange={setShowClosed}>Show resolved & false</Toggle>
                        </div>
                        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">Larger dots are more severe. Click a dot or cluster for details.</p>
                    </motion.aside>
                ) : (
                    <motion.button
                        key="open"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => setPanelOpen(true)}
                        className="absolute left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-lg"
                    >
                        <SlidersHorizontal className="h-4 w-4" /> Filters · {visible.length}
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.main>
    );
};

export default MapPage;
