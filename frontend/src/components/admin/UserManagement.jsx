import React, { useCallback, useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '../../utils/api';
import useAuthStore from '../../stores/authStore';
import { ROLE_BADGE } from '../../utils/constants';
import { formatRelativeTime, sameId } from '../../utils/helpers';

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
        setLoading(true);
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
        <div className="h-full flex flex-col p-4 md:p-6 min-h-0">
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name or email"
                        className="w-full bg-slate-800 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                </div>
                <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm">
                    <option value="">All roles</option>
                    <option value="citizen">Citizens</option>
                    <option value="responder">Responders</option>
                    <option value="admin">Admins</option>
                </select>
                <button onClick={load} aria-label="Refresh users" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-slate-900/50">
                <table className="w-full text-left min-w-[720px]">
                    <thead className="sticky top-0 bg-slate-900">
                        <tr className="text-xs text-gray-500">
                            <th className="p-3 border-b border-white/10">User</th>
                            <th className="p-3 border-b border-white/10">Role</th>
                            <th className="p-3 border-b border-white/10">Reports / Confirms</th>
                            <th className="p-3 border-b border-white/10">Reputation</th>
                            <th className="p-3 border-b border-white/10">Joined</th>
                            <th className="p-3 border-b border-white/10 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map(u => {
                            const self = sameId(u, me);
                            return (
                                <tr key={u._id} className={`hover:bg-white/5 ${u.isActive ? '' : 'opacity-50'}`}>
                                    <td className="p-3">
                                        <div className="text-sm font-semibold text-white">{u.name}{self && ' (you)'}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                    </td>
                                    <td className="p-3">
                                        {self ? (
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${ROLE_BADGE[u.role]}`}>{u.role}</span>
                                        ) : (
                                            <select
                                                aria-label={`Role for ${u.name}`}
                                                value={u.role}
                                                onChange={(e) => update(u, { role: e.target.value }, `${u.name} is now ${e.target.value}`)}
                                                className="px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs"
                                            >
                                                <option value="citizen">Citizen</option>
                                                <option value="responder">Responder</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="p-3 text-sm text-gray-300">{u.incidentsReported} / {u.incidentsVerified}</td>
                                    <td className="p-3 text-sm text-yellow-300">{u.reputation}</td>
                                    <td className="p-3 text-xs text-gray-500">{formatRelativeTime(u.createdAt)}</td>
                                    <td className="p-3 text-right">
                                        {!self && (
                                            <button
                                                onClick={() => update(u, { isActive: !u.isActive }, u.isActive ? 'Account deactivated' : 'Account reactivated')}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold border ${u.isActive ? 'border-red-500/30 text-red-300 hover:bg-red-500/10' : 'border-green-500/30 text-green-300 hover:bg-green-500/10'}`}
                                            >
                                                {u.isActive ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {!loading && users.length === 0 && <div className="p-10 text-center text-sm text-gray-500">No users found.</div>}
            </div>
        </div>
    );
};

export default UserManagement;
