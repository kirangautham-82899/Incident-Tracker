import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { X, Maximize2 } from 'lucide-react';
import useIncidentStore from '../../stores/incidentStore';
import IncidentDetails from './IncidentDetails';

const IncidentDetailModal = ({ incident: initialIncident, isOpen = true, onClose }) => {
    // Always render the freshest copy from the store (real-time updates)
    const live = useIncidentStore((s) => s.incidents.find(i => i._id === initialIncident?._id));
    const incident = live || initialIncident;

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, onClose]);

    if (!isOpen || !incident) return null;

    // Portal to <body>: parents with backdrop-filter/transform would otherwise trap position:fixed
    return createPortal(
        <div
            className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={incident.title}
        >
            <div
                className="relative w-full max-w-2xl bg-slate-900 rounded-xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto text-left"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-5 flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-white">{incident.title}</h2>
                    <div className="flex items-center gap-1 shrink-0">
                        <Link
                            to={`/incident/${incident._id}`}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Open full page"
                            onClick={onClose}
                        >
                            <Maximize2 className="w-5 h-5 text-gray-400" />
                        </Link>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="p-5">
                    <IncidentDetails incident={incident} onDeleted={onClose} />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default IncidentDetailModal;
