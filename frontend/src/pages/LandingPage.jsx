import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, MapPin, ShieldCheck, Radio, BarChart3, Camera, Siren, Users } from 'lucide-react';
import api from '../utils/api';
import { Button, Container, Dot, SeverityTag, StatRow, Stat } from '../components/ui';
import { PageTransition, Reveal, SplitWords, AnimatedNumber, EASE, staggerParent, staggerItem } from '../components/ui/motion';
import { INCIDENT_TYPE_OPTIONS, TYPE_LABELS, SEVERITY_COLORS } from '../utils/constants';
import { formatRelativeTime } from '../utils/helpers';

const STEPS = [
    { n: '01', title: 'Report', body: 'Pin the location, describe what you see and add photos. Takes under a minute, with or without an account.' },
    { n: '02', title: 'Confirm', body: 'People nearby confirm the report. Three confirmations verify it automatically, and duplicates are flagged.' },
    { n: '03', title: 'Respond', body: 'Responders see a priority-sorted queue, assign units and post status updates everyone can follow.' }
];

const FEATURES = [
    { icon: MapPin, title: 'Precise locations', body: 'GPS or tap-to-pin on the map, with addresses and a nearby-incidents safety check.' },
    { icon: ShieldCheck, title: 'Community verification', body: 'Confirmations, reputation and duplicate detection keep the signal clean.' },
    { icon: Radio, title: 'Live updates', body: 'The feed, map and console refresh automatically as reports come in and change.' },
    { icon: Camera, title: 'Photo and video evidence', body: 'Attach up to five files per report, stored securely and shown to responders.' },
    { icon: BarChart3, title: 'Response analytics', body: 'Trends by day, type and severity, plus average response and resolution times.' },
    { icon: Siren, title: 'One-tap SOS', body: 'A cancellable countdown files a critical report at your exact location.' }
];

const LandingPage = () => {
    const [stats, setStats] = useState(null);
    const [latest, setLatest] = useState([]);

    useEffect(() => {
        api.get('/analytics/stats').then(r => setStats(r.data.data)).catch(() => {});
        api.get('/incidents', { params: { limit: 5, sort: '-createdAt' } }).then(r => setLatest(r.data.data)).catch(() => {});
    }, []);

    return (
        <PageTransition>
            {/* Hero */}
            <Container className="pb-20 pt-12 sm:pt-20">
                <div className="grid gap-16 lg:grid-cols-[1.25fr_1fr] lg:items-end">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: EASE }}
                            className="mb-8 inline-flex items-center gap-2.5 text-sm text-ink-muted"
                        >
                            <Dot color="#E5402A" pulse />
                            <span>
                                {stats ? <><strong className="font-semibold text-ink">{stats.openIncidents}</strong> open incidents right now</> : 'Live incident network'}
                            </span>
                        </motion.div>

                        <h1 className="font-display text-[clamp(2.75rem,7vw,5.75rem)] font-semibold leading-[0.95] tracking-tightest">
                            <SplitWords text="See something." />
                            <br />
                            <SplitWords text="Report it" delay={0.15} />
                            <span className="font-serif font-normal italic tracking-normal text-signal">
                                <SplitWords text="in seconds." delay={0.3} />
                            </span>
                        </h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: EASE, delay: 0.45 }}
                            className="mt-8 max-w-xl text-lg leading-relaxed text-ink-muted"
                        >
                            Incident Tracker connects citizens and responders in real time. Report fires, accidents and hazards,
                            confirm what others see, and follow every incident until it's resolved.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: EASE, delay: 0.55 }}
                            className="mt-10 flex flex-wrap gap-3"
                        >
                            <Button to="/report" variant="signal" size="lg">
                                Report an incident <ArrowRight className="h-4 w-4" />
                            </Button>
                            <Button to="/dashboard" variant="outline" size="lg">View live feed</Button>
                        </motion.div>
                    </div>

                    {/* Latest reports (real data) */}
                    <motion.aside
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="eyebrow">Latest reports</span>
                            <Link to="/dashboard" className="link-underline text-[13px] font-medium text-ink-soft">All incidents</Link>
                        </div>
                        <motion.ul variants={staggerParent} initial="hidden" animate="show" className="divide-y divide-line border-y border-line">
                            {latest.length === 0 && (
                                <li className="py-6 text-sm text-ink-muted">No reports yet. Be the first to report something in your area.</li>
                            )}
                            {latest.map(inc => (
                                <motion.li key={inc._id} variants={staggerItem}>
                                    <Link to={`/incident/${inc._id}`} className="group flex items-center gap-4 py-4">
                                        <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[inc.severity] }} />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[15px] font-medium group-hover:text-signal">{inc.title}</div>
                                            <div className="mt-0.5 text-[13px] text-ink-muted">
                                                {TYPE_LABELS[inc.type]} · {formatRelativeTime(inc.createdAt)}
                                            </div>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </motion.aside>
                </div>
            </Container>

            {/* Incident types marquee */}
            <div className="overflow-hidden border-y border-line py-5" aria-hidden="true">
                <div className="flex w-max animate-marquee gap-12 whitespace-nowrap">
                    {[...INCIDENT_TYPE_OPTIONS, ...INCIDENT_TYPE_OPTIONS, ...INCIDENT_TYPE_OPTIONS, ...INCIDENT_TYPE_OPTIONS].map((t, i) => (
                        <span key={i} className="flex items-center gap-3 font-display text-2xl font-medium tracking-tight text-ink-faint">
                            <span className="h-2 w-2 rounded-full" style={{ background: t.color }} />
                            {t.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* How it works */}
            <Container className="py-24">
                <Reveal>
                    <p className="eyebrow mb-4">How it works</p>
                    <h2 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tightest sm:text-5xl">
                        From first report to <span className="font-serif font-normal italic">resolved</span>, in the open.
                    </h2>
                </Reveal>
                <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
                    {STEPS.map((step, i) => (
                        <Reveal key={step.n} delay={i * 0.1} className="md:px-10 md:first:pl-0 md:last:pr-0">
                            <div className="font-mono text-sm text-signal">{step.n}</div>
                            <h3 className="mt-4 text-2xl font-semibold tracking-tight">{step.title}</h3>
                            <p className="mt-3 leading-relaxed text-ink-muted">{step.body}</p>
                        </Reveal>
                    ))}
                </div>
            </Container>

            {/* Live numbers */}
            <Container>
                <Reveal>
                    <StatRow>
                        <Stat label="Incidents reported" value={<AnimatedNumber value={stats?.totalIncidents ?? 0} />} />
                        <Stat label="Resolved" value={<AnimatedNumber value={stats?.resolvedIncidents ?? 0} />} tone="#2F9E6E" />
                        <Stat label="Confirmed by community" value={<AnimatedNumber value={stats?.communityVerified ?? 0} />} />
                        <Stat label="Last 24 hours" value={<AnimatedNumber value={stats?.recentIncidents ?? 0} />} tone="#E5402A" />
                    </StatRow>
                </Reveal>
            </Container>

            {/* Features */}
            <Container className="py-24">
                <div className="grid gap-16 lg:grid-cols-[1fr_2fr]">
                    <Reveal className="lg:sticky lg:top-28 lg:self-start">
                        <p className="eyebrow mb-4">Features</p>
                        <h2 className="text-4xl font-semibold leading-tight tracking-tightest">
                            Everything a report needs. <span className="font-serif font-normal italic text-ink-soft">Nothing it doesn't.</span>
                        </h2>
                    </Reveal>
                    <div className="grid gap-x-12 sm:grid-cols-2">
                        {FEATURES.map((f, i) => (
                            <Reveal key={f.title} delay={(i % 2) * 0.08} className="border-t border-line py-8">
                                <f.icon className="h-5 w-5 text-signal" strokeWidth={1.75} />
                                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                                <p className="mt-2 leading-relaxed text-ink-muted">{f.body}</p>
                            </Reveal>
                        ))}
                    </div>
                </div>
            </Container>

            {/* Responders band */}
            <section className="bg-ink text-paper">
                <Container className="grid gap-12 py-24 lg:grid-cols-2 lg:items-center">
                    <Reveal>
                        <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/50">For responders</p>
                        <h2 className="text-4xl font-semibold leading-tight tracking-tightest text-paper sm:text-5xl">
                            One queue, <span className="font-serif font-normal italic text-signal">sorted by urgency.</span>
                        </h2>
                        <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/60">
                            Priority combines incident type, severity, community confirmations and time waiting.
                            Assign units, post internal notes and close incidents from the command console.
                        </p>
                        <div className="mt-10">
                            <Button to="/admin" variant="signal" size="lg">
                                Open command console <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </Reveal>
                    <Reveal delay={0.15}>
                        <ul className="divide-y divide-paper/10 border-y border-paper/10">
                            {[
                                ['critical', 'Fire', 'Smoke from 3rd floor, alarms ringing', '25.0'],
                                ['high', 'Accident', 'Two-car collision, lane blocked', '17.0'],
                                ['medium', 'Infrastructure', 'Large pothole on main road', '10.0']
                            ].map(([sev, type, title, score]) => (
                                <li key={title} className="flex items-center gap-5 py-5">
                                    <span className="w-12 font-mono text-sm tabular-nums text-paper/50">{score}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-medium text-paper">{title}</div>
                                        <div className="mt-1 text-[13px] text-paper/50">{type}</div>
                                    </div>
                                    <SeverityTag severity={sev} />
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 flex items-center gap-2 text-[13px] text-paper/40">
                            <Users className="h-3.5 w-3.5" /> Example queue. Responder access is granted by an administrator.
                        </p>
                    </Reveal>
                </Container>
            </section>

            {/* Final CTA */}
            <Container className="py-28 text-center">
                <Reveal>
                    <h2 className="mx-auto max-w-3xl text-5xl font-semibold leading-[1.02] tracking-tightest sm:text-6xl">
                        Help your community <span className="font-serif font-normal italic text-signal">respond faster.</span>
                    </h2>
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <Button to="/signup" size="lg">Create a free account</Button>
                        <Button to="/report" variant="outline" size="lg">Report without an account</Button>
                    </div>
                </Reveal>
            </Container>
        </PageTransition>
    );
};

export default LandingPage;
