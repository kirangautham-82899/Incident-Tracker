import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronRight, Inbox } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import { getEarnedBadges, calculateLevel, getNextBadge, BADGES } from '../utils/gamification';
import { SEVERITY_COLORS, TYPE_LABELS } from '../utils/constants';
import { formatRelativeTime } from '../utils/helpers';
import { Button, Container, EmptyState, Field, Input, RoleTag, Section, Spinner, Stat, StatRow, StatusTag, cx } from '../components/ui';
import { AnimatedNumber, EASE, PageTransition, staggerItem, staggerParent } from '../components/ui/motion';

const ProfilePage = () => {
    const { user, refreshUser, updateProfile } = useAuthStore();
    const [myReports, setMyReports] = useState([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', currentPassword: '', newPassword: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        refreshUser();
        api.get('/incidents', { params: { mine: 'true', limit: 50 } })
            .then(res => setMyReports(res.data.data))
            .catch(() => setMyReports([]))
            .finally(() => setLoadingReports(false));
    }, [refreshUser]);

    if (!user) return null;

    const earned = getEarnedBadges(user);
    const level = calculateLevel(user.reputation || 0);
    const nextBadge = getNextBadge(user);
    const confirmed = myReports.filter(r => r.verificationCount > 0 || ['verified', 'in-progress', 'resolved'].includes(r.status)).length;
    const confirmationRate = myReports.length ? Math.round((confirmed / myReports.length) * 100) : 0;

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.newPassword && (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword))) {
            toast.error('New password needs 8+ characters with a letter and a number');
            return;
        }
        setSaving(true);
        const updates = { name: form.name, phone: form.phone };
        if (form.newPassword) {
            updates.currentPassword = form.currentPassword;
            updates.newPassword = form.newPassword;
        }
        const result = await updateProfile(updates);
        setSaving(false);
        if (result.success) {
            toast.success(form.newPassword ? 'Saved. Other sessions were signed out.' : 'Profile saved');
            setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
        } else {
            toast.error(result.error);
        }
    };

    return (
        <PageTransition>
            <Container>
                {/* Identity header */}
                <header className="flex flex-col gap-8 pb-10 pt-12 sm:flex-row sm:items-end sm:justify-between">
                    <div className="flex items-center gap-6">
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: EASE }}
                            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-ink font-display text-3xl font-semibold text-paper"
                        >
                            {user.name.charAt(0).toUpperCase()}
                        </motion.div>
                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
                                className="text-4xl font-semibold tracking-tightest"
                            >
                                {user.name}
                            </motion.h1>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                                <RoleTag role={user.role} />
                                <span>Level {level.level} · <span className="font-serif text-base italic text-ink-soft">{level.name}</span></span>
                                <span>Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                    <Button to="/report" variant="signal">Report an incident</Button>
                </header>

                <StatRow>
                    <Stat label="Reputation" value={<AnimatedNumber value={user.reputation || 0} />} tone="#E5402A" />
                    <Stat label="Reports" value={<AnimatedNumber value={user.incidentsReported || 0} />} />
                    <Stat label="Confirmations given" value={<AnimatedNumber value={user.incidentsVerified || 0} />} />
                    <Stat label="Reports confirmed" value={<><AnimatedNumber value={confirmationRate} />%</>} tone="#2F9E6E" />
                </StatRow>

                {/* My reports */}
                <Section title="Your reports" description="Everything you've reported, with its current status." className="mt-14">
                    {loadingReports ? (
                        <Spinner />
                    ) : myReports.length === 0 ? (
                        <EmptyState icon={Inbox} title="No reports yet" action={<Button to="/report">Report an incident</Button>}>
                            When you report something, you can follow it here until it's resolved.
                        </EmptyState>
                    ) : (
                        <motion.ul variants={staggerParent} initial="hidden" animate="show" className="border-t border-line">
                            {myReports.map(r => (
                                <motion.li key={r._id} variants={staggerItem} className="border-b border-line">
                                    <Link to={`/incident/${r._id}`} className="group flex items-center gap-4 py-4 transition-colors hover:bg-paper-deep/60 sm:px-2">
                                        <span className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: SEVERITY_COLORS[r.severity] }} />
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-medium group-hover:text-signal">{r.title}</div>
                                            <div className="mt-0.5 text-[13px] text-ink-muted">
                                                {TYPE_LABELS[r.type]} · {formatRelativeTime(r.createdAt)} · {r.verificationCount} confirmation{r.verificationCount === 1 ? '' : 's'}
                                            </div>
                                        </div>
                                        <StatusTag status={r.status} className="hidden sm:inline-flex" />
                                        <ChevronRight className="h-4 w-4 text-ink-faint transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                    )}
                </Section>

                {/* Achievements */}
                <Section title="Achievements" description="Earn reputation: +1 per confirmation you give, +2 when your report is verified, +5 when it's resolved, −5 if it's marked false.">
                    {nextBadge && (
                        <div className="mb-8 max-w-md">
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-ink-muted">Next: <span className="font-medium text-ink">{nextBadge.badge.name}</span></span>
                                <span className="text-ink-muted">{nextBadge.remaining} to go</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-paper-deep">
                                <motion.div className="h-full rounded-full bg-signal" initial={{ width: 0 }} animate={{ width: `${nextBadge.progress}%` }} transition={{ duration: 1, ease: EASE }} />
                            </div>
                        </div>
                    )}
                    <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
                        {Object.values(BADGES).map(badge => {
                            const has = earned.some(b => b.id === badge.id);
                            return (
                                <li key={badge.id} className={cx('flex items-center gap-4 border-b border-line py-4', !has && 'opacity-40')}>
                                    <span className={cx('text-2xl', !has && 'grayscale')} aria-hidden="true">{badge.icon}</span>
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold">{badge.name}</div>
                                        <div className="text-[13px] text-ink-muted">{badge.description}</div>
                                    </div>
                                    {has && <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-sev-low">Earned</span>}
                                </li>
                            );
                        })}
                    </ul>
                </Section>

                {/* Account */}
                <Section title="Account" description="Changing your password signs you out everywhere else.">
                    <form onSubmit={handleSave} className="grid max-w-3xl gap-5 sm:grid-cols-2">
                        <Field label="Name" htmlFor="p-name">
                            <Input id="p-name" value={form.name} maxLength={50} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </Field>
                        <Field label="Email" htmlFor="p-email" hint="Contact us to change your email.">
                            <Input id="p-email" value={user.email} disabled className="opacity-60" />
                        </Field>
                        <Field label="Phone" htmlFor="p-phone" hint="Shared with responders on your reports.">
                            <Input id="p-phone" value={form.phone} maxLength={20} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </Field>
                        <div className="hidden sm:block" />
                        <Field label="Current password" htmlFor="p-cur">
                            <Input id="p-cur" type="password" autoComplete="current-password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
                        </Field>
                        <Field label="New password" htmlFor="p-new" hint="8+ characters, a letter and a number.">
                            <Input id="p-new" type="password" autoComplete="new-password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                        </Field>
                        <div className="sm:col-span-2">
                            <Button type="submit" loading={saving}>Save changes</Button>
                        </div>
                    </form>
                </Section>
            </Container>
        </PageTransition>
    );
};

export default ProfilePage;
