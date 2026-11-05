import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Maximize2 } from 'lucide-react';
import useIncidentStore from '../../stores/incidentStore';
import IncidentDetails from './IncidentDetails';
import { IconButton } from '../ui';
import { EASE } from '../ui/motion';

/**
 * Incident details in a side sheet that slides in from the right.
 * Always renders the freshest copy from the store (real-time updates).
 */
const IncidentDetailModal = ({ incident: initialIncident, isOpen = true, onClose }) => {
    const live = useIncidentStore((s) => s.incidents.find(i => i._id === initialIncident?._id));
    const incident = live || initialIncident;
    const open = Boolean(isOpen && incident);

    useEffect(() => {
        if (!open) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previous;
        };
    }, [open, onClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div className="fixed inset-0 z-[1500]" initial="closed" animate="open" exit="closed">
                    <motion.div
                        className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]"
                        variants={{ closed: { opacity: 0 }, open: { opacity: 1 } }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                    />
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label={incident.title}
                        variants={{ closed: { x: '100%' }, open: { x: 0 } }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="absolute inset-y-0 right-0 flex w-full max-w-[640px] flex-col bg-paper shadow-[-24px_0_60px_-30px_rgba(22,22,26,0.4)]"
                    >
                        <div className="flex items-center justify-between border-b border-line px-6 py-4">
                            <span className="eyebrow">Incident #{incident._id.slice(-6).toUpperCase()}</span>
                            <div className="flex items-center gap-1">
                                <Link to={`/incident/${incident._id}`} onClick={onClose} aria-label="Open full page" title="Open full page"
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-paper-deep hover:text-ink">
                                    <Maximize2 className="h-4 w-4" />
                                </Link>
                                <IconButton label="Close" onClick={onClose}><X className="h-5 w-5" /></IconButton>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-8">
                            <h2 className="mb-6 text-3xl font-semibold leading-tight tracking-tightest">{incident.title}</h2>
                            <IncidentDetails incident={incident} onDeleted={onClose} />
                        </div>
                    </motion.aside>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default IncidentDetailModal;
