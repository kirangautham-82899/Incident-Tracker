import React, { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import { formatRelativeTime, sameId } from '../../utils/helpers';
import { EmptyState, RoleTag, Select, Spinner, cx } from '../ui';
import { EASE } from '../ui/motion';

/**
 * Admin-only: promote citizens to responders/admins and deactivate accounts.
 */
const UserManagement = () => {
    const { user: me } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const res = await api.get('/users', { params: { search: search || undefined, role: roleFilter || undefined } });
            setUsers(res.data.data);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Failed to load users'));
        } finally {
            setLoading(false);
        }
    }, [search, roleFilter]);

    useEffect(() => {
        const timer = setTimeout(load, 300);
        return () => clearTimeout(timer);
    }, [load]);

    const update = async (target, changes, message) => {
        try {
            const res = await api.put(`/users/${target._id}`, changes);
            setUsers(prev => prev.map(u => (u._id === target._id ? res.data.data : u)));
            toast.success(message);
        } catch (error) {
            toast.error(getErrorMessage(error, 'Update failed'));
        }
    };

    return (
        <div>
            <div className="flex flex-wrap items-center gap-3 pb-5">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" aria-label="Search users" className="field pl-10" />
                </div>
                <Select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-auto">
                    <option value="">All roles</option>
                    <option value="citizen">Citizens</option>
                    <option value="responder">Responders</option>
                    <option value="admin">Admins</option>
                </Select>
            </div>

            {loading ? (
                <Spinner label="Loading users" />
            ) : users.length === 0 ? (
                <EmptyState icon={Users} title="No users found">Try a different search.</EmptyState>
            ) : (
                <ul className="border-t border-line">
                    <AnimatePresence initial={false}>
                        {users.map(u => {
                            const self = sameId(u, me);
                            return (
                                <motion.li
                                    key={u._id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: u.isActive ? 1 : 0.45 }}
                                    transition={{ duration: 0.3, ease: EASE }}
                                    className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line py-4"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-deep font-display text-sm font-semibold">
                                        {u.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate font-medium">{u.name}{self && <span className="text-ink-muted"> (you)</span>}</span>
                                            {!u.isActive && <span className="font-mono text-[10px] uppercase tracking-wider text-sev-critical">Deactivated</span>}
                                        </div>
                                        <div className="truncate text-[13px] text-ink-muted">{u.email}</div>
                                    </div>
                                    <div className="hidden w-40 text-[13px] text-ink-muted md:block">
                                        {u.incidentsReported} reports · {u.incidentsVerified} confirms
                                        <div>{u.reputation} reputation · joined {formatRelativeTime(u.createdAt)}</div>
                                    </div>
                                    {self ? (
                                        <RoleTag role={u.role} />
                                    ) : (
                                        <Select
                                            aria-label={`Role for ${u.name}`}
                                            value={u.role}
                                            onChange={(e) => update(u, { role: e.target.value }, `${u.name} is now a ${e.target.value}`)}
                                            className="w-36 py-2 text-sm"
                                        >
                                            <option value="citizen">Citizen</option>
                                            <option value="responder">Responder</option>
                                            <option value="admin">Admin</option>
                                        </Select>
                                    )}
                                    {!self && (
                                        <button
                                            onClick={() => update(u, { isActive: !u.isActive }, u.isActive ? 'Account deactivated' : 'Account reactivated')}
                                            className={cx('w-24 text-right text-[13px] font-medium', u.isActive ? 'text-ink-muted hover:text-sev-critical' : 'text-sev-low hover:underline')}
                                        >
                                            {u.isActive ? 'Deactivate' : 'Reactivate'}
                                        </button>
                                    )}
                                </motion.li>
                            );
                        })}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
};

export default UserManagement;
