import React, { useState } from 'react';
import { ArrowUpRight, Mail, ShieldAlert, Siren } from 'lucide-react';
import { Button, Container, Field, Input, PageHeader, Select, Textarea } from '../components/ui';
import { PageTransition, Reveal } from '../components/ui/motion';

const CONTACT_EMAIL = 'kirangautham82899@gmail.com';

const TOPICS = ['General question', 'Account or data deletion', 'Report a problem with an incident', 'Become a responder', 'Security issue'];

const ContactPage = () => {
    const [form, setForm] = useState({ name: '', topic: TOPICS[0], message: '' });

    // Opens the visitor's email app with the message filled in (no message is stored on our servers)
    const handleSubmit = (e) => {
        e.preventDefault();
        const subject = `[Incident Tracker] ${form.topic}`;
        const body = `${form.message}\n\n— ${form.name}`;
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <PageTransition>
            <Container>
                <PageHeader
                    eyebrow="Contact"
                    title="Get in"
                    accent="touch."
                    description="Questions, data requests or want to help as a responder? Send us a message."
                />
                <div className="grid gap-16 border-t border-line pt-12 lg:grid-cols-[1fr_1.3fr]">
                    <Reveal className="space-y-10">
                        <div className="flex gap-4">
                            <Siren className="mt-1 h-5 w-5 shrink-0 text-signal" />
                            <div>
                                <h2 className="font-semibold">Emergency?</h2>
                                <p className="mt-1 text-ink-muted">Don't use this form. Call 112 / 911, or use the SOS button after logging in.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Mail className="mt-1 h-5 w-5 shrink-0 text-ink-muted" />
                            <div>
                                <h2 className="font-semibold">Email</h2>
                                <a href={`mailto:${CONTACT_EMAIL}`} className="link-underline mt-1 inline-block text-ink-soft">{CONTACT_EMAIL}</a>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-ink-muted" />
                            <div>
                                <h2 className="font-semibold">Security issues</h2>
                                <a
                                    href="https://github.com/kirangautham-82899/Incident-Tracker/security/advisories/new"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="link-underline mt-1 inline-flex items-center gap-1 text-ink-soft"
                                >
                                    Report privately on GitHub <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="Your name" htmlFor="c-name">
                                    <Input id="c-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={80} />
                                </Field>
                                <Field label="Topic" htmlFor="c-topic">
                                    <Select id="c-topic" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
                                        {TOPICS.map(t => <option key={t}>{t}</option>)}
                                    </Select>
                                </Field>
                            </div>
                            <Field label="Message" htmlFor="c-msg" hint="This opens your email app with the message ready to send.">
                                <Textarea id="c-msg" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required maxLength={2000} />
                            </Field>
                            <Button type="submit" size="lg" disabled={!form.name.trim() || !form.message.trim()}>
                                Write email <ArrowUpRight className="h-4 w-4" />
                            </Button>
                        </form>
                    </Reveal>
                </div>
            </Container>
        </PageTransition>
    );
};

export default ContactPage;
