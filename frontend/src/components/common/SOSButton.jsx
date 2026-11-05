import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import { getCurrentLocation } from '../../utils/helpers';

const COUNTDOWN_SECONDS = 3;

/**
 * Panic button: after a cancellable countdown, files a critical "safety"
 * incident at the user's GPS location so responders see it immediately.
 */
const SOSButton = ({ className = '' }) => {
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
                description: 'SOS panic button pressed. The reporter needs immediate assistance at this location.',
                location: { coordinates: [longitude, latitude], address: 'SOS GPS location' },
                media: []
            });
            if (result.success) {
                toast.success('SOS sent. Responders have been alerted. If you can, call your local emergency number.', { duration: 8000, icon: '🚨' });
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

    if (countdown !== null) {
        return (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-red-900/90 backdrop-blur-sm" role="alertdialog" aria-label="Sending SOS">
                <div className="text-center">
                    <div className="bg-white text-red-600 rounded-full w-64 h-64 flex flex-col items-center justify-center shadow-2xl">
                        <span className="text-6xl font-black mb-2">{sending ? '…' : countdown}</span>
                        <span className="text-xl font-bold uppercase tracking-widest">{sending ? 'Sending' : 'Sending SOS'}</span>
                        {!sending && (
                            <button
                                onClick={() => setCountdown(null)}
                                className="mt-8 px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-bold flex items-center gap-2"
                            >
                                <X className="w-5 h-5" /> Cancel
                            </button>
                        )}
                    </div>
                    <p className="mt-8 text-white font-medium text-lg">
                        {sending ? 'Getting your location and alerting responders...' : 'Tap cancel if this was a mistake'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={() => setCountdown(COUNTDOWN_SECONDS)}
            title="Send an SOS alert with your location"
            className={`flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-lg shadow-red-600/30 transition-transform hover:scale-105 ${className}`}
        >
            <AlertTriangle className="w-5 h-5" />
            <span>SOS</span>
        </button>
    );
};

export default SOSButton;
