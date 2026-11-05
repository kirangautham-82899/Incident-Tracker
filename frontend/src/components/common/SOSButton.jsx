import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import useIncidentStore from '../../stores/incidentStore';
import { getCurrentLocation } from '../../utils/helpers';
import { EASE } from '../ui/motion';
import toast from 'react-hot-toast';

const COUNTDOWN_SECONDS = 3;

/**
 * Panic button: after a cancellable countdown, files a critical "safety"
 * incident at the user's GPS location so responders see it immediately.
 */
const SOSButton = ({ compact = false }) => {
    const navigate = useNavigate();
    const { createIncident } = useIncidentStore();
    const [countdown, setCountdown] = useState(null); // null = idle
    const [sending, setSending] = useState(false);

    const triggerSOS = useCallback(async () => {
        setSending(true);
        try {
            const { latitude, longitude } = await getCurrentLocation();
            const result = await createIncident({
                title: 'SOS - immediate help needed',
                type: 'safety',
                severity: 'critical',
                description: 'SOS button pressed. The reporter needs immediate assistance at this location.',
                location: { coordinates: [longitude, latitude], address: 'SOS GPS location' },
                media: []
            });
            if (result.success) {
                toast.success('SOS sent. Responders have been alerted.', { duration: 8000 });
                navigate(`/incident/${result.data._id}`);
            } else {
                toast.error(result.error || 'Failed to send SOS');
            }
        } catch (error) {
            toast.error(`${error.message} SOS was not sent. Call your local emergency number.`, { duration: 8000 });
        } finally {
            setSending(false);
            setCountdown(null);
        }
    }, [createIncident, navigate]);

    useEffect(() => {
        if (countdown === null || sending) return undefined;
        if (countdown === 0) {
            triggerSOS();
            return undefined;
        }
        const timer = setTimeout(() => setCountdown(c => (c === null ? null : c - 1)), 1000);
        return () => clearTimeout(timer);
    }, [countdown, sending, triggerSOS]);

    return (
        <>
            <button
                onClick={() => setCountdown(COUNTDOWN_SECONDS)}
                title="Send an SOS alert with your location"
                className="group relative inline-flex h-8 items-center gap-2 rounded-full bg-signal-soft px-3 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-signal transition-colors hover:bg-signal hover:text-white"
            >
                <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-pulse-dot rounded-full bg-signal group-hover:bg-white" />
                    <span className="relative h-2 w-2 rounded-full bg-signal group-hover:bg-white" />
                </span>
                {!compact && 'SOS'}
                {compact && <span className="sr-only">SOS</span>}
            </button>

            {createPortal(
                <AnimatePresence>
                    {countdown !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-signal text-white"
                            role="alertdialog"
                            aria-label="Sending SOS"
                        >
                            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/70">
                                {sending ? 'Getting your location' : 'Sending SOS in'}
                            </p>
                            <div className="relative my-8 flex h-56 w-56 items-center justify-center">
                                <span className="absolute inset-0 animate-pulse-dot rounded-full bg-white/30" />
                                <span className="absolute inset-4 rounded-full ring-1 ring-white/40" />
                                <AnimatePresence mode="popLayout">
                                    <motion.span
                                        key={sending ? 'sending' : countdown}
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.4 }}
                                        transition={{ duration: 0.35, ease: EASE }}
                                        className="font-display text-8xl font-semibold tabular-nums"
                                    >
                                        {sending ? '…' : countdown}
                                    </motion.span>
                                </AnimatePresence>
                            </div>
                            {!sending && (
                                <button
                                    onClick={() => setCountdown(null)}
                                    className="rounded-full bg-white px-8 py-3 font-medium text-signal transition-transform hover:scale-105"
                                >
                                    Cancel
                                </button>
                            )}
                            <p className="mt-8 max-w-xs text-center text-sm text-white/70">
                                If anyone's life is in danger, also call your local emergency number.
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default SOSButton;
