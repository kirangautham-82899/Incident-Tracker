import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Crosshair, Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import useIncidentStore from '../../stores/incidentStore';
import useAuthStore from '../../stores/authStore';
import { INCIDENT_TYPE_OPTIONS, SEVERITY_OPTIONS, SEVERITY_COLORS, TYPE_LABELS } from '../../utils/constants';
import { getCurrentLocation, formatCoordinates } from '../../utils/helpers';
import { generateInsights } from '../../utils/aiAnalysis';
import MediaUpload from '../common/MediaUpload';
import VoiceInput from '../common/VoiceInput';
import LocationPicker from '../map/LocationPicker';
import { Button, Field, Input, Segmented, Textarea, cx } from '../ui';
import { EASE } from '../ui/motion';

const emptyForm = (user) => ({
    type: '',
    title: '',
    description: '',
    severity: 'medium',
    location: { coordinates: [], address: '' },
    reporter: { name: user?.name || '', contact: '' },
    media: []
});

// Numbered step: big index on the left, content on the right, hairline on top
// Animates on mount (not on scroll) so no field can stay hidden if the user scrolls or jumps past it
const Step = ({ n, title, hint, error, children }) => (
    <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.1 + (Number(n) - 1) * 0.06 }}
        className="grid gap-6 border-t border-line py-10 md:grid-cols-[200px_1fr]"
    >
        <div>
            <div className="font-mono text-sm text-signal">{n}</div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">{title}</h2>
            {hint && <p className="mt-1.5 text-sm text-ink-muted">{hint}</p>}
            {error && <p className="mt-2 text-sm text-sev-critical">{error}</p>}
        </div>
        <div className="min-w-0">{children}</div>
    </motion.section>
);

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

    // Keyword analysis of the description suggests a type and severity
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
            toast.success('Location set');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsGettingLocation(false);
        }
    };

    const validate = () => {
        const next = {};
        if (!formData.type) next.type = 'Choose what kind of incident this is.';
        if (formData.title.trim().length < 3) next.title = 'Give it a short title (3+ characters).';
        if (!formData.description.trim()) next.description = 'Describe what is happening.';
        if (formData.location.coordinates.length !== 2) next.location = 'Set the location with GPS or by tapping the map.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isUploading) return toast.error('Please wait for uploads to finish');
        if (!validate()) {
            toast.error('A few details are missing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        const result = await createIncident({
            ...formData,
            title: formData.title.trim(),
            description: formData.description.trim(),
            reporter: isAuthenticated ? undefined : formData.reporter
        });

        if (result.success) {
            toast.success('Reported. Responders have been notified.');
            if (result.possibleDuplicates?.length) {
                toast(`A similar incident was already reported nearby: "${result.possibleDuplicates[0].title}"`, { icon: '⚠️', duration: 6000 });
            }
            setFormData(emptyForm(user));
            setSeverityTouched(false);
            onSubmitted?.(result.data);
        } else {
            toast.error(result.error || 'Failed to submit report');
        }
    };

    const suggestion = aiInsights?.suggestedType && aiInsights.suggestedType !== formData.type ? aiInsights.suggestedType : null;

    return (
        <form onSubmit={handleSubmit} noValidate>
            <Step n="01" title="What happened?" hint="Pick the closest category." error={errors.type}>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Incident type">
                    {INCIDENT_TYPE_OPTIONS.map((option) => {
                        const active = formData.type === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => { update({ type: option.value }); setErrors(p => ({ ...p, type: undefined })); }}
                                className={cx(
                                    'relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors duration-200',
                                    active ? 'text-white' : 'text-ink-soft ring-1 ring-inset ring-line-strong hover:ring-ink'
                                )}
                            >
                                {active && (
                                    <motion.span layoutId="type-pill" className="absolute inset-0 rounded-full" style={{ background: option.color }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 36 }} />
                                )}
                                <span className="relative" aria-hidden="true">{option.emoji}</span>
                                <span className="relative">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </Step>

            <Step n="02" title="Describe it" hint="What do you see? Who is affected? Any hazards?">
                <div className="space-y-5">
                    <Field label="Title" htmlFor="incident-title" error={errors.title}>
                        <Input
                            id="incident-title"
                            maxLength={100}
                            placeholder="e.g. Car accident blocking two lanes"
                            value={formData.title}
                            onChange={(e) => update({ title: e.target.value })}
                            className="text-base"
                        />
                    </Field>
                    <Field label="Details" htmlFor="incident-description" error={errors.description}>
                        <Textarea
                            id="incident-description"
                            maxLength={1000}
                            rows={5}
                            placeholder="Describe the situation, people affected, hazards…"
                            value={formData.description}
                            onChange={(e) => update({ description: e.target.value })}
                        />
                        <div className="flex items-center justify-between pt-1">
                            <VoiceInput onTranscript={(text) => setFormData(prev => ({ ...prev, description: prev.description ? `${prev.description} ${text}` : text }))} />
                            <span className="font-mono text-[12px] text-ink-faint">{formData.description.length}/1000</span>
                        </div>
                    </Field>

                    <AnimatePresence>
                        {aiInsights && (aiInsights.insights.length > 0 || suggestion) && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                                className="overflow-hidden"
                            >
                                <div className="flex gap-3 border-l-2 border-signal pl-4">
                                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal" />
                                    <div className="space-y-1.5 text-sm text-ink-soft">
                                        {aiInsights.insights.filter(i => !i.includes('Suggested type')).map((insight, idx) => (
                                            <p key={idx}>{insight.replace(/^[^\w]+/u, '')}</p>
                                        ))}
                                        {suggestion && (
                                            <button type="button" onClick={() => update({ type: suggestion })} className="link-underline font-medium text-ink">
                                                Sounds like {TYPE_LABELS[suggestion]?.toLowerCase()} — use that category
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Step>

            <Step n="03" title="How serious?" hint={!severityTouched && aiInsights ? 'Suggested from your description.' : 'Your best guess is fine.'}>
                <Segmented
                    options={SEVERITY_OPTIONS}
                    value={formData.severity}
                    colorFor={(v) => SEVERITY_COLORS[v]}
                    onChange={(severity) => { update({ severity }); setSeverityTouched(true); }}
                />
                <AnimatePresence>
                    {formData.severity === 'critical' && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="mt-4 flex items-start gap-2 text-sm font-medium text-sev-critical"
                        >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            If anyone's life is in danger, call 112 / 911 first.
                        </motion.p>
                    )}
                </AnimatePresence>
            </Step>

            <Step n="04" title="Where?" hint="Use GPS, or tap the map and drag the pin." error={errors.location}>
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <Button variant="outline" onClick={handleGetLocation} loading={isGettingLocation}>
                            {!isGettingLocation && <Crosshair className="h-4 w-4" />}
                            {isGettingLocation ? 'Finding you…' : 'Use my location'}
                        </Button>
                        {formData.location.coordinates.length === 2 && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[13px] text-ink-muted">
                                {formatCoordinates(formData.location.coordinates)}
                            </motion.span>
                        )}
                    </div>
                    <LocationPicker value={formData.location.coordinates} onChange={setCoordinates} height={300} />
                    <Input
                        aria-label="Address or landmark"
                        maxLength={200}
                        placeholder="Address or landmark (optional, helps responders)"
                        value={formData.location.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                    />
                </div>
            </Step>

            <Step n="05" title="Evidence" hint="Optional. Photos help responders understand the scene.">
                <MediaUpload value={formData.media} onChange={(media) => update({ media })} onUploadingChange={setIsUploading} maxFiles={5} />
            </Step>

            {!isAuthenticated && (
                <Step n="06" title="Your details" hint="Optional. Only responders see your contact.">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Name" htmlFor="rep-name">
                            <Input id="rep-name" maxLength={50} placeholder="Anonymous" value={formData.reporter.name}
                                onChange={(e) => update({ reporter: { ...formData.reporter, name: e.target.value } })} />
                        </Field>
                        <Field label="Phone or email" htmlFor="rep-contact">
                            <Input id="rep-contact" maxLength={100} value={formData.reporter.contact}
                                onChange={(e) => update({ reporter: { ...formData.reporter, contact: e.target.value } })} />
                        </Field>
                    </div>
                    <p className="mt-4 text-sm text-ink-muted">
                        <Link to="/login" className="link-underline font-medium text-ink">Log in</Link> to follow your report and earn reputation.
                    </p>
                </Step>
            )}

            <div className="sticky bottom-0 z-10 -mx-5 flex items-center justify-between gap-3 border-t border-line bg-paper/90 px-5 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" variant="signal" size="lg" loading={isLoading} disabled={isUploading}>
                    {isUploading ? 'Uploading…' : 'Submit report'} {!isLoading && !isUploading && <ArrowRight className="h-4 w-4" />}
                </Button>
            </div>
        </form>
    );
};

export default IncidentReportForm;
