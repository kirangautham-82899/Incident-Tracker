import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import IncidentDetails from '../components/incident/IncidentDetails';
import useIncidentStore from '../stores/incidentStore';
import useAuthStore from '../stores/authStore';
import { Button, Container, EmptyState, Spinner } from '../components/ui';
import { PageTransition } from '../components/ui/motion';

const IncidentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const { currentIncident, fetchIncident } = useIncidentStore();
    const [result, setResult] = useState({ id: null, ok: false });

    useEffect(() => {
        let cancelled = false;
        fetchIncident(id).then((res) => { if (!cancelled) setResult({ id, ok: res.success }); });
        return () => { cancelled = true; };
    }, [id, token, fetchIncident]);

    const incident = currentIncident?._id === id ? currentIncident : null;
    const status = result.id !== id ? 'loading' : result.ok ? 'ready' : 'error';

    return (
        <PageTransition>
            <Container className="max-w-3xl pt-8">
                <button onClick={() => navigate(-1)} className="group mb-10 inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back
                </button>

                {status === 'loading' && !incident && <Spinner label="Loading incident" />}

                {status === 'error' && !incident && (
                    <EmptyState icon={SearchX} title="Incident not found" action={<Button to="/dashboard">Go to the live feed</Button>}>
                        It may have been removed, or the link is wrong.
                    </EmptyState>
                )}

                {incident && (
                    <article>
                        <p className="eyebrow mb-4">Incident #{incident._id.slice(-6).toUpperCase()}</p>
                        <h1 className="mb-8 text-4xl font-semibold leading-[1.08] tracking-tightest sm:text-5xl">{incident.title}</h1>
                        <IncidentDetails incident={incident} onDeleted={() => navigate('/dashboard')} />
                    </article>
                )}
            </Container>
        </PageTransition>
    );
};

export default IncidentDetailPage;
