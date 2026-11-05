import React from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Check, MapPin, UserCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { formatRelativeTime, hasUserVerified, isReporter } from '../../utils/helpers';
import { OPEN_STATUSES, SEVERITY_COLORS, TYPE_LABELS } from '../../utils/constants';
import { StatusTag, SeverityTag, cx } from '../ui';
import { EASE } from '../ui/motion';

/**
 * One incident as a list row (no card chrome): severity rule on the left,
 * title + meta in the middle, status and confirm action on the right.
 */
const IncidentRow = ({ incident, onOpen, onVerify }) => {
    const { isAuthenticated, user } = useAuthStore();
    const verified = hasUserVerified(incident, user);
    const canVerify = isAuthenticated && !verified && !isReporter(incident, user) && OPEN_STATUSES.includes(incident.status);
    const closed = !OPEN_STATUSES.includes(incident.status);

    return (
        <motion.li
            layout="position"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="group relative border-b border-line"
        >
            <div
                role="button"
                tabIndex={0}
                onClick={() => onOpen(incident)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(incident))}
                className="flex cursor-pointer items-stretch gap-4 py-5 pr-2 transition-colors duration-200 hover:bg-paper-deep/60 sm:gap-6 sm:pl-2"
            >
                <span
                    className={cx('w-[3px] shrink-0 rounded-full transition-all duration-300 group-hover:w-1.5', closed && 'opacity-30')}
                    style={{ background: SEVERITY_COLORS[incident.severity] }}
                />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <SeverityTag severity={incident.severity} />
                        <span className="text-[13px] text-ink-faint">{TYPE_LABELS[incident.type]}</span>
                        <span className="font-mono text-[11px] text-ink-faint">#{incident._id.slice(-6).toUpperCase()}</span>
                    </div>
                    <h3 className={cx('mt-1.5 text-[17px] font-semibold leading-snug tracking-tight transition-colors group-hover:text-signal', closed && 'text-ink-muted')}>
                        {incident.title}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-ink-muted">{incident.description}</p>
                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-faint">
                        <span>{formatRelativeTime(incident.createdAt)}</span>
                        {incident.location?.address && (
                            <span className="flex min-w-0 items-center gap-1"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{incident.location.address}</span></span>
                        )}
                        {incident.assignedTo?.name && (
                            <span className="flex items-center gap-1"><UserCheck className="h-3.5 w-3.5" />{incident.assignedTo.name}</span>
                        )}
                        <span>by {incident.reporter?.name || 'Anonymous'}</span>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end justify-between gap-3">
                    <StatusTag status={incident.status} />
                    <div className="flex items-center gap-2">
                        {canVerify ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); onVerify(incident._id); }}
                                title="Confirm you can see this incident too"
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium text-ink-soft ring-1 ring-inset ring-line-strong transition-all hover:bg-ink hover:text-paper hover:ring-ink"
                            >
                                <Check className="h-3.5 w-3.5" /> Confirm
                                <span className="tabular-nums text-ink-faint">{incident.verificationCount || 0}</span>
                            </button>
                        ) : (
                            <span className={cx('inline-flex items-center gap-1 text-[13px] tabular-nums', verified ? 'font-medium text-sev-low' : 'text-ink-faint')} title={verified ? 'You confirmed this' : 'Confirmations'}>
                                <Check className="h-3.5 w-3.5" /> {incident.verificationCount || 0}
                            </span>
                        )}
                        <ChevronRight className="h-4 w-4 text-ink-faint transition-transform duration-300 group-hover:translate-x-1 group-hover:text-ink" />
                    </div>
                </div>
            </div>
        </motion.li>
    );
};

export default IncidentRow;
