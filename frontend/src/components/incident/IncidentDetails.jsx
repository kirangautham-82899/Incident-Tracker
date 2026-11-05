import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, TrendingUp, UserCheck, ExternalLink, AlertTriangle, FileDown, CheckCircle, History } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useIncidentStore from '../../stores/incidentStore';
import CommentsSection from './CommentsSection';
import StaffActions from './StaffActions';
import SocialShare from '../common/SocialShare';
import {
    STATUS_BADGE, SEVERITY_BADGE, STATUS_LABELS, OPEN_STATUSES, AUTO_VERIFY_THRESHOLD, isStaff
} from '../../utils/constants';
import {
    formatDate, formatCoordinates, formatRelativeTime, mapsLink, hasUserVerified, isReporter, capitalize
} from '../../utils/helpers';

const InfoTile = ({ icon: Icon, label, children }) => (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-white/5 min-w-0">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Icon className="w-4 h-4" />
            <span className="text-xs font-semibold">{label}</span>
        </div>
        <div className="text-sm text-white break-words">{children}</div>
    </div>
);

/**
 * Full incident view: details, media, status timeline, verification,
 * staff controls and comments. Used by the modal and the /incident/:id page.
 */
const IncidentDetails = ({ incident, onDeleted }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { verifyIncident } = useIncidentStore();

    const canVerify = isAuthenticated &&
        !isReporter(incident, user) &&
        !hasUserVerified(incident, user) &&
        OPEN_STATUSES.includes(incident.status);

    const handleVerify = async () => {
        const result = await verifyIncident(incident._id);
        if (result.success) toast.success('Thanks for confirming this incident');
        else toast.error(result.error);
    };

    const handlePdf = async () => {
        const { generateIncidentPDF } = await import('../../utils/pdfGenerator');
        generateIncidentPDF(incident);
    };

    const link = mapsLink(incident.location?.coordinates);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${SEVERITY_BADGE[incident.severity]}`}>
                    {incident.severity?.toUpperCase()}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_BADGE[incident.status]}`}>
                    {STATUS_LABELS[incident.status] || incident.status}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/10 text-gray-300">
                    {capitalize(incident.type)}
                </span>
                <span className="text-xs text-gray-500 font-mono">#{incident._id?.slice(-8).toUpperCase()}</span>
            </div>

            {incident.duplicateOf && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>
                        Possible duplicate of{' '}
                        <Link to={`/incident/${incident.duplicateOf._id || incident.duplicateOf}`} className="underline">
                            {incident.duplicateOf.title || 'an earlier report'}
                        </Link>{' '}
                        reported nearby.
                    </span>
                </div>
            )}

            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-2">Description</h3>
                <p className="text-gray-200 leading-relaxed whitespace-pre-line">{incident.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoTile icon={MapPin} label="Location">
                    <div>{incident.location?.address || 'No address given'}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatCoordinates(incident.location?.coordinates)}</div>
                    {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline mt-1">
                            Open in Maps <ExternalLink className="w-3 h-3" />
                        </a>
                    )}
                </InfoTile>
                <InfoTile icon={Calendar} label="Reported">
                    {formatDate(incident.createdAt)}
                    <div className="text-xs text-gray-400">{formatRelativeTime(incident.createdAt)}</div>
                </InfoTile>
                <InfoTile icon={User} label="Reporter">
                    {incident.reporter?.name || 'Anonymous'}
                    {incident.reporter?.contact && <div className="text-xs text-gray-400">{incident.reporter.contact}</div>}
                </InfoTile>
                <InfoTile icon={UserCheck} label="Assigned responder">
                    {incident.assignedTo?.name || 'Not assigned yet'}
                </InfoTile>
            </div>

            {/* Community verification */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span>
                        <strong className="text-white">{incident.verificationCount || 0}</strong> confirmation(s)
                        {incident.status === 'reported' && (
                            <span className="text-gray-500"> · auto-verified at {AUTO_VERIFY_THRESHOLD}</span>
                        )}
                    </span>
                </div>
                {canVerify && (
                    <button onClick={handleVerify} className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 rounded-lg text-xs font-bold">
                        <CheckCircle className="w-4 h-4" /> I can confirm this
                    </button>
                )}
                {hasUserVerified(incident, user) && (
                    <span className="text-xs text-green-400 font-bold">You confirmed this incident</span>
                )}
                {!isAuthenticated && (
                    <Link to="/login" className="text-xs text-blue-400 hover:underline">Log in to confirm</Link>
                )}
            </div>

            {incident.media?.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Media</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {incident.media.map((item, idx) => (
                            item.type === 'video' ? (
                                <video key={idx} src={item.url} controls className="w-full h-48 object-cover rounded-lg bg-black" />
                            ) : (
                                <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer">
                                    <img src={item.url} alt={`Incident evidence ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" loading="lazy" />
                                </a>
                            )
                        ))}
                    </div>
                </div>
            )}

            {incident.statusHistory?.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2">
                        <History className="w-4 h-4" /> Timeline
                    </h3>
                    <ol className="relative border-l border-white/10 ml-2 space-y-3">
                        {incident.statusHistory.map((entry, idx) => (
                            <li key={entry._id || idx} className="ml-4">
                                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                                <div className="text-sm text-white">{STATUS_LABELS[entry.status] || entry.status}</div>
                                <div className="text-xs text-gray-500">
                                    {entry.changedByName || 'System'} · {formatDate(entry.timestamp)}
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {isStaff(user) && <StaffActions incident={incident} onDeleted={onDeleted} />}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
                <SocialShare incident={incident} />
                <button onClick={handlePdf} className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-xs font-bold text-gray-200">
                    <FileDown className="w-4 h-4" /> Download PDF
                </button>
            </div>

            <CommentsSection incidentId={incident._id} />
        </div>
    );
};

export default IncidentDetails;
