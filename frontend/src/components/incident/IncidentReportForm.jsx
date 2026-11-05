import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, AlertCircle, Send, Lightbulb, Zap, Crosshair, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import useAuthStore from '../../stores/authStore';
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS } from '../../utils/constants';
import { getCurrentLocation, formatCoordinates } from '../../utils/helpers';
import { generateInsights } from '../../utils/aiAnalysis';
import MediaUpload from '../common/MediaUpload';
import VoiceInput from '../common/VoiceInput';
import LocationPicker from '../map/LocationPicker';

const SEVERITY_STYLE = {
    low: 'border-green-500 bg-green-500/15 text-green-300',
    medium: 'border-yellow-500 bg-yellow-500/15 text-yellow-300',
    high: 'border-orange-500 bg-orange-500/15 text-orange-300',
    critical: 'border-red-500 bg-red-500/15 text-red-300'
};

const emptyForm = (user) => ({
    type: '',
    title: '',
    description: '',
    severity: 'medium',
    location: { coordinates: [], address: '' },
    reporter: { name: user?.name || '', contact: '' },
    media: []
});

const inputClass = 'w-full px-4 py-3 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all';
const labelClass = 'block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2';

const IncidentReportForm = ({ onClose, onSubmitted }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { createIncident, isLoading } = useIncidentStore();

    const [formData, setFormData] = useState(() => emptyForm(user));
    const [severityTouched, setSeverityTouched] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [aiInsights, setAiInsights] = useState(null);
    const [errors, setErrors] = useState({});

    const update = (patch) => setFormData(prev => ({ ...prev, ...patch }));

    // Keyword analysis of the description: suggests type and severity
    useEffect(() => {
        if (formData.description.trim().length > 15) {
            const insights = generateInsights({ ...formData, createdAt: new Date(), verificationCount: 0 });
            setAiInsights(insights);
            if (!severityTouched && insights.urgency) {
                setFormData(prev => ({ ...prev, severity: insights.urgency }));
            }
        } else {
            setAiInsights(null);
        }
    }, [formData.description, formData.type]); // eslint-disable-line react-hooks/exhaustive-deps

    const setCoordinates = (coordinates) => {
        setFormData(prev => ({ ...prev, location: { ...prev.location, coordinates } }));
        setErrors(prev => ({ ...prev, location: undefined }));
    };

    const handleGetLocation = async () => {
        setIsGettingLocation(true);
        try {
            const position = await getCurrentLocation();
            setCoordinates([Number(position.longitude.toFixed(6)), Number(position.latitude.toFixed(6))]);
            toast.success('Location detected');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsGettingLocation(false);
        }
    };

    const validate = () => {
        const next = {};
        if (!formData.type) next.type = 'Choose what kind of incident this is';
        if (formData.title.trim().length < 3) next.title = 'Give the incident a short title (3+ characters)';
        if (!formData.description.trim()) next.description = 'Describe what is happening';
        if (formData.location.coordinates.length !== 2) next.location = 'Set the location: use GPS or click the map';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) {
            toast.error('Please wait for uploads to finish');
            return;
        }
        if (!validate()) {
            toast.error('Please fix the highlighted fields');
            return;
        }

        const payload = {
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            reporter: isAuthenticated ? undefined : formData.reporter
        };
        const result = await createIncident(payload);

        if (result.success) {
            toast.success('Incident reported. Responders have been notified.');
            if (result.possibleDuplicates?.length) {
                toast(`A similar incident was already reported nearby (${result.possibleDuplicates[0].title}). Responders will review both.`, {
                    icon: '⚠️',
                    duration: 6000
                });
            }
            setFormData(emptyForm(user));
            setSeverityTouched(false);
            onSubmitted?.(result.data);
        } else {
            toast.error(result.error || 'Failed to submit report');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Incident Type */}
            <div>
                <span className={labelClass}>Incident type *</span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Incident type">
                    {INCIDENT_TYPE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={formData.type === option.value}
                            onClick={() => { update({ type: option.value }); setErrors(p => ({ ...p, type: undefined })); }}
                            className={`p-3 rounded-xl border text-left text-sm font-bold transition-all ${formData.type === option.value
                                ? 'bg-blue-600/20 border-blue-500 text-white'
                                : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                {errors.type && <p className="text-xs text-red-400 mt-2">{errors.type}</p>}
            </div>

            {/* Title */}
            <div>
                <label htmlFor="incident-title" className={labelClass}>Title *</label>
                <input
                    id="incident-title"
                    type="text"
                    maxLength={100}
                    placeholder="e.g. Car accident blocking two lanes"
                    value={formData.title}
                    onChange={(e) => update({ title: e.target.value })}
                    className={`${inputClass} ${errors.title ? 'border-red-500/60' : ''}`}
                />
                {errors.title && <p className="text-xs text-red-400 mt-2">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label htmlFor="incident-description" className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                        What is happening? *
                    </label>
                    <VoiceInput
                        onTranscript={(text) => setFormData(prev => ({
                            ...prev,
                            description: prev.description ? `${prev.description} ${text}` : text
                        }))}
                    />
                </div>
                <textarea
                    id="incident-description"
                    maxLength={1000}
                    className={`${inputClass} min-h-[120px] ${errors.description ? 'border-red-500/60' : ''}`}
                    placeholder="Describe the situation, people affected, hazards... (or use voice input)"
                    value={formData.description}
                    onChange={(e) => update({ description: e.target.value })}
                />
                <div className="flex justify-between text-xs mt-1">
                    <span className="text-red-400">{errors.description}</span>
                    <span className="text-gray-500">{formData.description.length}/1000</span>
                </div>
            </div>

            {/* Smart analysis */}
            {aiInsights && (aiInsights.insights.length > 0 || aiInsights.suggestedType) && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-purple-300">
                        <Zap className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Smart analysis</span>
                    </div>
                    {aiInsights.insights.map((insight, idx) => (
                        <div key={idx} className="text-sm text-gray-300">{insight}</div>
                    ))}
                    {aiInsights.suggestedType && aiInsights.suggestedType !== formData.type && (
                        <button
                            type="button"
                            onClick={() => update({ type: aiInsights.suggestedType })}
                            className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-purple-200 text-xs font-bold flex items-center gap-2"
                        >
                            <Lightbulb className="w-3 h-3" />
                            Use suggested type: {aiInsights.suggestedType}
                        </button>
                    )}
                </div>
            )}

            {/* Severity */}
            <div>
                <span className={labelClass}>Severity</span>
                <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Severity">
                    {SEVERITY_OPTIONS.map(option => (
                        <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={formData.severity === option.value}
                            onClick={() => { update({ severity: option.value }); setSeverityTouched(true); }}
                            className={`py-2 rounded-lg border text-sm font-bold transition-all ${formData.severity === option.value
                                ? SEVERITY_STYLE[option.value]
                                : 'border-white/10 bg-slate-900/50 text-gray-400 hover:text-gray-200'}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                {!severityTouched && aiInsights && (
                    <p className="text-xs text-gray-500 mt-2">Suggested from your description. Change it if it is wrong.</p>
                )}
            </div>

            {/* Location */}
            <div className="space-y-3">
                <span className={labelClass}>Location *</span>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation}
                        className="px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-gray-200 hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center gap-2"
                    >
                        <Crosshair className={`w-4 h-4 ${isGettingLocation ? 'animate-spin text-blue-500' : 'text-blue-400'}`} />
                        <span className="text-sm">{isGettingLocation ? 'Detecting...' : 'Use my current location'}</span>
                    </button>
                    {formData.location.coordinates.length === 2 && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-300">
                            <MapPin className="w-4 h-4" />
                            {formatCoordinates(formData.location.coordinates)}
                        </div>
                    )}
                </div>
                <LocationPicker value={formData.location.coordinates} onChange={setCoordinates} />
                <p className="text-xs text-gray-500">Click the map to place the pin, or drag it to adjust.</p>
                {errors.location && <p className="text-xs text-red-400">{errors.location}</p>}
                <input
                    type="text"
                    maxLength={200}
                    aria-label="Address or landmark"
                    placeholder="Address or landmark (optional, helps responders)"
                    value={formData.location.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                    className={`${inputClass} text-sm`}
                />
            </div>

            {/* Media */}
            <div>
                <span className={labelClass}>Photos / videos (optional)</span>
                <MediaUpload
                    value={formData.media}
                    onChange={(media) => update({ media })}
                    onUploadingChange={setIsUploading}
                    maxFiles={5}
                />
            </div>

            {/* Reporter info for anonymous reports */}
            {!isAuthenticated && (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-3">
                            <p className="text-sm text-yellow-200">
                                You are reporting anonymously. <Link to="/login" className="underline">Log in</Link> to track your report and earn reputation.
                            </p>
                            <input
                                type="text"
                                maxLength={50}
                                aria-label="Your name"
                                placeholder="Your name (optional)"
                                value={formData.reporter.name}
                                onChange={(e) => update({ reporter: { ...formData.reporter, name: e.target.value } })}
                                className={`${inputClass} text-sm py-2`}
                            />
                            <input
                                type="text"
                                maxLength={100}
                                aria-label="Phone or email"
                                placeholder="Phone or email so responders can reach you (optional)"
                                value={formData.reporter.contact}
                                onChange={(e) => update({ reporter: { ...formData.reporter, contact: e.target.value } })}
                                className={`${inputClass} text-sm py-2`}
                            />
                        </div>
                    </div>
                </div>
            )}

            {formData.severity === 'critical' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-200">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    If anyone's life is in danger, call your local emergency number (112 / 911) first.
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-gray-300 font-bold rounded-xl transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading || isUploading}
                    className="flex-[2] px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            <span>{isUploading ? 'Uploading media...' : 'Submit report'}</span>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default IncidentReportForm;
