import React, { useState } from 'react';
import { MapPin, Clock, CheckCircle, AlertTriangle, User, Shield, AlertOctagon, Eye, Flame, Wrench, HelpCircle, UserCheck } from 'lucide-react';
import { formatRelativeTime } from '../../utils/helpers';
import { hasUserVerified, isReporter } from '../../utils/helpers';
import { STATUS_BADGE, STATUS_LABELS, SEVERITY_BAR, OPEN_STATUSES } from '../../utils/constants';
import useAuthStore from '../../stores/authStore';
import IncidentDetailModal from './IncidentDetailModal';
import SocialShare from '../common/SocialShare';

const TYPE_STYLES = {
    accident: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: AlertOctagon },
    fire: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Flame },
    medical: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Shield },
    infrastructure: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', icon: Wrench },
    safety: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertTriangle },
    other: { color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/20', icon: HelpCircle }
};

const SEVERITY_TEXT = {
    critical: 'text-red-400 animate-pulse',
    high: 'text-orange-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
};

const IncidentCard = ({ incident, onVerify }) => {
    const { isAuthenticated, user } = useAuthStore();
    const [showDetails, setShowDetails] = useState(false);

    const verified = hasUserVerified(incident, user);
    const canVerify = isAuthenticated && !verified && !isReporter(incident, user) && OPEN_STATUSES.includes(incident.status);
    const typeStyle = TYPE_STYLES[incident.type] || TYPE_STYLES.other;
    const TypeIcon = typeStyle.icon;

    return (
        <div className="group relative bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-slate-800/60 transition-all duration-300 overflow-hidden flex flex-col">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${SEVERITY_BAR[incident.severity] || SEVERITY_BAR.medium}`} />

            <div className="flex justify-between items-start gap-3 mb-3">
                <div className="flex gap-3 min-w-0">
                    <div className={`p-2.5 h-fit rounded-xl ${typeStyle.bg} ${typeStyle.color} border ${typeStyle.border}`}>
                        <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs font-bold uppercase tracking-wider ${SEVERITY_TEXT[incident.severity] || 'text-blue-400'}`}>
                                {incident.severity}
                            </span>
                            <span className="text-slate-600 text-xs">•</span>
                            <span className="text-slate-400 text-xs font-mono">#{incident._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h3 className="text-base font-bold text-white leading-tight break-words">
                            {incident.title}
                        </h3>
                    </div>
                </div>

                <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_BADGE[incident.status]}`}>
                    {STATUS_LABELS[incident.status] || incident.status}
                </span>
            </div>

            <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">
                {incident.description}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-400">
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5 min-w-0">
                    <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate">{incident.location?.address || 'Pinned on map'}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                    <Clock className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{formatRelativeTime(incident.createdAt)}</span>
                </div>
                {incident.assignedTo?.name && (
                    <div className="col-span-2 flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-white/5">
                        <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">Responder: {incident.assignedTo.name}</span>
                    </div>
                )}
            </div>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-gray-500 min-w-0">
                    <User className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">{incident.reporter?.name || 'Anonymous'}</span>
                </div>

                <div className="flex items-center gap-2">
                    <SocialShare incident={incident} compact />

                    <button
                        onClick={() => setShowDetails(true)}
                        className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                    >
                        <Eye className="w-3 h-3" />
                        Details
                    </button>

                    {canVerify ? (
                        <button
                            onClick={() => onVerify(incident._id)}
                            title="Confirm you can see this incident too"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold transition-all"
                        >
                            <CheckCircle className="w-3 h-3" />
                            Confirm ({incident.verificationCount || 0})
                        </button>
                    ) : (
                        <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border ${verified ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'text-gray-400 border-white/10'}`}
                            title={verified ? 'You confirmed this incident' : 'Confirmations'}
                        >
                            <CheckCircle className="w-3 h-3" />
                            {incident.verificationCount || 0}
                        </span>
                    )}
                </div>
            </div>

            <IncidentDetailModal
                incident={incident}
                isOpen={showDetails}
                onClose={() => setShowDetails(false)}
            />
        </div>
    );
};

export default IncidentCard;
