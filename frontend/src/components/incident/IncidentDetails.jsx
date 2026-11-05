import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ExternalLink, AlertTriangle, FileDown, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useIncidentStore from '../../stores/incidentStore';
import CommentsSection from './CommentsSection';
import StaffActions from './StaffActions';
import SocialShare from '../common/SocialShare';
import { Button, SeverityTag, StatusTag, TypeTag } from '../ui';
import { EASE } from '../ui/motion';
import { STATUS_LABELS, STATUS_COLORS, OPEN_STATUSES, AUTO_VERIFY_THRESHOLD, isStaff } from '../../utils/constants';
import { formatDate, formatCoordinates, formatRelativeTime, mapsLink, hasUserVerified, isReporter } from '../../utils/helpers';

// Definition-list row
const Meta = ({ label, children }) => (
    <div className="grid grid-cols-[120px_1fr] gap-4 border-b border-line py-3.5 text-sm">
        <dt className="text-ink-muted">{label}</dt>
        <dd className="min-w-0 break-words text-ink">{children}</dd>
    </div>
);

/**
 * Full incident view: description, metadata, confirmations, media, timeline,
 * staff controls and comments. Used by the side sheet and /incident/:id.
 */
const IncidentDetails = ({ incident, onDeleted }) => {
    const { user, isAuthenticated } = useAuthStore();
    const { verifyIncident } = useIncidentStore();

    const verified = hasUserVerified(incident, user);
    const canVerify = isAuthenticated && !isReporter(incident, user) && !verified && OPEN_STATUSES.includes(incident.status);
    const count = incident.verificationCount || 0;
    const link = mapsLink(incident.location?.coordinates);

    const handleVerify = async () => {
        const result = await verifyIncident(incident._id);
        if (result.success) toast.success('Thanks for confirming');
        else toast.error(result.error);
    };

    const handlePdf = async () => {
        const { generateIncidentPDF } = await import('../../utils/pdfGenerator');
        generateIncidentPDF(incident);
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <SeverityTag severity={incident.severity} />
                <StatusTag status={incident.status} />
                <TypeTag type={incident.type} />
            </div>

            {incident.duplicateOf && (
                <p className="flex items-start gap-2.5 border-l-2 border-sev-medium pl-4 text-sm text-ink-soft">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-sev-medium" />
                    <span>
                        Possibly the same as{' '}
                        <Link to={`/incident/${incident.duplicateOf._id || incident.duplicateOf}`} className="link-underline font-medium text-ink">
                            {incident.duplicateOf.title || 'an earlier report'}
                        </Link>, reported nearby.
                    </span>
                </p>
            )}

            <p className="whitespace-pre-line text-[17px] leading-relaxed text-ink-soft">{incident.description}</p>

            {/* Confirmations */}
            <div className="border-y border-line py-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <span className="font-display text-3xl font-semibold tabular-nums">{count}</span>
                            <span className="text-sm text-ink-muted">confirmation{count === 1 ? '' : 's'}</span>
                        </div>
                        {incident.status === 'reported' && (
                            <div className="mt-3 flex items-center gap-1.5" aria-label={`${count} of ${AUTO_VERIFY_THRESHOLD} needed to verify`}>
                                {Array.from({ length: AUTO_VERIFY_THRESHOLD }).map((_, i) => (
                                    <motion.span
                                        key={i}
                                        className="h-1 w-10 rounded-full"
                                        initial={false}
                                        animate={{ backgroundColor: i < count ? '#2F9E6E' : '#E6E3DC' }}
                                        transition={{ duration: 0.4, ease: EASE }}
                                    />
                                ))}
                                <span className="ml-2 text-[13px] text-ink-muted">auto-verifies at {AUTO_VERIFY_THRESHOLD}</span>
                            </div>
                        )}
                    </div>
                    {canVerify && (
                        <Button variant="primary" onClick={handleVerify}><Check className="h-4 w-4" /> I can confirm this</Button>
                    )}
                    {verified && <span className="flex items-center gap-1.5 text-sm font-medium text-sev-low"><Check className="h-4 w-4" /> You confirmed this</span>}
                    {!isAuthenticated && <Link to="/login" className="link-underline text-sm font-medium">Log in to confirm</Link>}
                </div>
            </div>

            <dl>
                <Meta label="Location">
                    {incident.location?.address || 'Pinned on map'}
                    <div className="mt-0.5 font-mono text-[12px] text-ink-faint">{formatCoordinates(incident.location?.coordinates)}</div>
                    {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" className="link-underline mt-1 inline-flex items-center gap-1 text-[13px] font-medium">
                            Open in Google Maps <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </Meta>
                <Meta label="Reported">{formatDate(incident.createdAt)} <span className="text-ink-muted">· {formatRelativeTime(incident.createdAt)}</span></Meta>
                <Meta label="Reporter">
                    {incident.reporter?.name || 'Anonymous'}
                    {incident.reporter?.contact && <span className="text-ink-muted"> · {incident.reporter.contact}</span>}
                </Meta>
                <Meta label="Responder">{incident.assignedTo?.name || <span className="text-ink-muted">Not assigned yet</span>}</Meta>
            </dl>

            {incident.media?.length > 0 && (
                <div>
                    <h3 className="eyebrow mb-4">Evidence</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {incident.media.map((item, idx) => item.type === 'video' ? (
                            <video key={idx} src={item.url} controls className="aspect-[4/3] w-full rounded-lg bg-ink object-cover" />
                        ) : (
                            <a key={idx} href={item.url} target="_blank" rel="noopener noreferrer" className="group overflow-hidden rounded-lg">
                                <img src={item.url} alt={`Evidence ${idx + 1}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {incident.statusHistory?.length > 0 && (
                <div>
                    <h3 className="eyebrow mb-5">Timeline</h3>
                    <ol className="relative ml-1 space-y-6 border-l border-line pl-6">
                        {incident.statusHistory.map((entry, idx) => (
                            <motion.li
                                key={entry._id || idx}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, ease: EASE, delay: idx * 0.06 }}
                                className="relative"
                            >
                                <span className="absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-paper" style={{ background: STATUS_COLORS[entry.status] }} />
                                <div className="text-sm font-medium">{STATUS_LABELS[entry.status] || entry.status}</div>
                                <div className="mt-0.5 text-[13px] text-ink-muted">{entry.changedByName || 'System'} · {formatDate(entry.timestamp)}</div>
                            </motion.li>
                        ))}
                    </ol>
                </div>
            )}

            {isStaff(user) && <StaffActions incident={incident} onDeleted={onDeleted} />}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <SocialShare incident={incident} />
                <Button variant="ghost" size="sm" onClick={handlePdf}><FileDown className="h-4 w-4" /> Download PDF</Button>
            </div>

            <CommentsSection incidentId={incident._id} />
        </div>
    );
};

export default IncidentDetails;
