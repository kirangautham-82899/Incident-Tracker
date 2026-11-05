import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Star, Target, Shield, TrendingUp, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import api from '../utils/api';
import { getEarnedBadges, calculateLevel, getNextBadge, BADGES } from '../utils/gamification';
import { STATUS_BADGE, STATUS_LABELS, ROLE_BADGE } from '../utils/constants';
import { formatRelativeTime } from '../utils/helpers';
import Navbar from '../components/layout/Navbar';

const LEVEL_BADGE = {
    gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
};

const STAT_TONE = {
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300',
    green: 'from-green-500/20 to-emerald-500/10 border-green-500/30 text-green-300',
    purple: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300'
};

const StatCard = ({ icon: Icon, label, value, tone }) => (
    <div className={`p-5 rounded-2xl bg-gradient-to-br ${STAT_TONE[tone]} border`}>
        <div className="flex items-center justify-between mb-2">
            <Icon className="w-7 h-7" />
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
        <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
    </div>
);

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

    const earnedBadges = getEarnedBadges(user);
    const level = calculateLevel(user.reputation || 0);
    const nextBadge = getNextBadge(user);
    const confirmedReports = myReports.filter(r => r.verificationCount > 0 || ['verified', 'in-progress', 'resolved'].includes(r.status)).length;
    const confirmationRate = myReports.length ? Math.round((confirmedReports / myReports.length) * 100) : 0;

    const handleSave = async (e) => {
        e.preventDefault();
        if (form.newPassword && (form.newPassword.length < 8 || !/[A-Za-z]/.test(form.newPassword) || !/[0-9]/.test(form.newPassword))) {
            toast.error('New password must be at least 8 characters and include a letter and a number');
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
            toast.success('Profile updated');
            setForm(f => ({ ...f, currentPassword: '', newPassword: '' }));
        } else {
            toast.error(result.error);
        }
    };

    const inputClass = 'w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-lg text-white text-sm focus:border-blue-500 outline-none';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />

            <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
                <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-3xl font-black">
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black mb-2">{user.name}</h1>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${LEVEL_BADGE[level.color]}`}>
                                    Level {level.level} · {level.name}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${ROLE_BADGE[user.role]}`}>{user.role}</span>
                                <span className="flex items-center gap-1 text-yellow-400 font-bold">
                                    <Star className="w-5 h-5 fill-current" /> {user.reputation} reputation
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard icon={Target} label="Reports submitted" value={user.incidentsReported || 0} tone="blue" />
                    <StatCard icon={Shield} label="Incidents you confirmed" value={user.incidentsVerified || 0} tone="green" />
                    <StatCard icon={TrendingUp} label="Your reports confirmed" value={`${confirmationRate}%`} tone="purple" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="p-6 rounded-2xl bg-slate-900/50 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <Trophy className="w-6 h-6 text-yellow-500" />
                            <h2 className="text-xl font-black">Achievements</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {Object.values(BADGES).map(badge => {
                                const earned = earnedBadges.some(b => b.id === badge.id);
                                return (
                                    <div key={badge.id} className={`p-3 rounded-xl border text-center ${earned ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-slate-800/30 border-white/5 opacity-40'}`}>
                                        <div className="text-3xl mb-1">{badge.icon}</div>
                                        <div className="text-xs font-bold">{badge.name}</div>
                                        <div className="text-[11px] text-gray-400">{badge.description}</div>
                                    </div>
                                );
                            })}
                        </div>
                        {nextBadge && (
                            <div className="mt-5">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-400">Next: {nextBadge.badge.name}</span>
                                    <span className="font-bold text-blue-400">{nextBadge.remaining} more report{nextBadge.remaining === 1 ? '' : 's'}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${nextBadge.progress}%` }} />
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 mt-4">
                            Reputation: +1 for each confirmation you give, +2 when your report is verified, +5 when it is resolved, −5 if it is marked false.
                        </p>
                    </section>

                    <section className="p-6 rounded-2xl bg-slate-900/50 border border-white/10">
                        <h2 className="text-xl font-black mb-4">Account</h2>
                        <form onSubmit={handleSave} className="space-y-3">
                            <label className="block text-xs text-gray-400 space-y-1">
                                <span>Name</span>
                                <input className={inputClass} value={form.name} maxLength={50} onChange={e => setForm({ ...form, name: e.target.value })} required />
                            </label>
                            <label className="block text-xs text-gray-400 space-y-1">
                                <span>Email</span>
                                <input className={`${inputClass} opacity-60`} value={user.email} disabled />
                            </label>
                            <label className="block text-xs text-gray-400 space-y-1">
                                <span>Phone (shared with responders on your reports)</span>
                                <input className={inputClass} value={form.phone} maxLength={20} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label className="block text-xs text-gray-400 space-y-1">
                                    <span>Current password</span>
                                    <input type="password" autoComplete="current-password" className={inputClass} value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} />
                                </label>
                                <label className="block text-xs text-gray-400 space-y-1">
                                    <span>New password</span>
                                    <input type="password" autoComplete="new-password" className={inputClass} value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} />
                                </label>
                            </div>
                            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold disabled:opacity-50">
                                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save changes'}
                            </button>
                            <p className="text-xs text-gray-500">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
                        </form>
                    </section>
                </div>

                <section className="p-6 rounded-2xl bg-slate-900/50 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black">My reports</h2>
                        <Link to="/report" className="text-sm text-blue-400 hover:underline">Report an incident</Link>
                    </div>
                    {loadingReports ? (
                        <p className="text-sm text-gray-500">Loading...</p>
                    ) : myReports.length === 0 ? (
                        <p className="text-sm text-gray-500">You haven't reported any incidents yet.</p>
                    ) : (
                        <ul className="divide-y divide-white/5">
                            {myReports.map(r => (
                                <li key={r._id}>
                                    <Link to={`/incident/${r._id}`} className="flex items-center justify-between gap-3 py-3 hover:bg-white/5 px-2 rounded-lg">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold truncate">{r.title}</div>
                                            <div className="text-xs text-gray-500">{r.type} · {formatRelativeTime(r.createdAt)} · {r.verificationCount} confirmations</div>
                                        </div>
                                        <span className={`shrink-0 px-2 py-0.5 rounded text-[11px] font-bold border ${STATUS_BADGE[r.status]}`}>{STATUS_LABELS[r.status]}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ProfilePage;
