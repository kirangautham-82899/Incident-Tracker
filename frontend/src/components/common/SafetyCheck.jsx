import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, RotateCw } from 'lucide-react';
import api from '../../utils/api';
import { getCurrentLocation } from '../../utils/helpers';
import { SEVERITY_COLORS, OPEN_STATUSES } from '../../utils/constants';
import { Button } from '../ui';
import { EASE } from '../ui/motion';

const LEVELS = {
    safe: { label: 'Looks calm', color: '#2F9E6E' },
    caution: { label: 'Stay alert', color: '#C98A12' },
    unsafe: { label: 'Elevated risk', color: '#D7262E' }
};

// Score open incidents within 2 km of the user (100 = nothing nearby)
const score = (incidents) => {
    const open = incidents.filter(i => OPEN_STATUSES.includes(i.status));
    let risk = 0;
    for (const i of open) risk += { critical: 30, high: 15, medium: 6, low: 2 }[i.severity] || 4;
    const value = Math.max(0, 100 - risk);
    const level = value >= 70 ? 'safe' : value >= 40 ? 'caution' : 'unsafe';
    return { value, level, open };
};

const RADIUS = 52;
const CIRC = 2 * Math.PI * RADIUS;

const SafetyCheck = () => {
    const [state, setState] = useState('idle'); // idle | checking | done | error
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const check = async () => {
        setState('checking');
        setError('');
        try {
            const { latitude, longitude } = await getCurrentLocation();
            const res = await api.get('/incidents/nearby', { params: { latitude, longitude, maxDistance: 2000 } });
            setResult(score(res.data.data));
            setState('done');
        } catch (err) {
            setError(err?.response?.data?.error || err.message || 'Could not check your area');
            setState('error');
        }
    };

    const level = result && LEVELS[result.level];

    return (
        <section className="border-t border-line pt-6 lg:border-t-0 lg:pt-0">
            <p className="eyebrow mb-2">Nearby safety</p>
            <h2 className="text-xl font-semibold tracking-tight">Am I safe here?</h2>
            <p className="mt-1.5 text-sm text-ink-muted">Checks open incidents within 2 km of your location.</p>

            <AnimatePresence mode="wait">
                {state === 'done' && result ? (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="mt-6"
                    >
                        <div className="flex items-center gap-5">
                            <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90" role="img" aria-label={`Safety score ${result.value} out of 100`}>
                                <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#E6E3DC" strokeWidth="6" />
                                <motion.circle
                                    cx="60" cy="60" r={RADIUS} fill="none" stroke={level.color} strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={CIRC}
                                    initial={{ strokeDashoffset: CIRC }}
                                    animate={{ strokeDashoffset: CIRC * (1 - result.value / 100) }}
                                    transition={{ duration: 1.2, ease: EASE }}
                                />
                            </svg>
                            <div>
                                <div className="font-display text-4xl font-semibold tabular-nums">{result.value}</div>
                                <div className="text-sm font-medium" style={{ color: level.color }}>{level.label}</div>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-line">
                            {result.open.length === 0 ? (
                                <p className="py-4 text-sm text-ink-muted">No open incidents nearby.</p>
                            ) : (
                                <ul>
                                    {result.open.slice(0, 5).map(i => (
                                        <li key={i._id} className="border-b border-line">
                                            <Link to={`/incident/${i._id}`} className="flex items-center gap-3 py-3 text-sm hover:text-signal">
                                                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[i.severity] }} />
                                                <span className="truncate">{i.title}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={check} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted hover:text-ink">
                            <RotateCw className="h-3.5 w-3.5" /> Check again
                        </button>
                    </motion.div>
                ) : (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5">
                        <Button variant="outline" onClick={check} loading={state === 'checking'}>
                            {state !== 'checking' && <Crosshair className="h-4 w-4" />}
                            {state === 'checking' ? 'Checking your area…' : 'Check my area'}
                        </Button>
                        {state === 'error' && <p className="mt-3 text-sm text-sev-critical">{error}</p>}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default SafetyCheck;
