import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Loading from '../components/common/Loading';
import IncidentDetails from '../components/incident/IncidentDetails';
import useIncidentStore from '../stores/incidentStore';
import useAuthStore from '../stores/authStore';

const IncidentDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = useAuthStore((s) => s.token);
    const { currentIncident, fetchIncident } = useIncidentStore();
    // Result of the last fetch, tagged with the id it was for
    const [result, setResult] = useState({ id: null, ok: false });

    useEffect(() => {
        let cancelled = false;
        fetchIncident(id).then((res) => {
            if (!cancelled) setResult({ id, ok: res.success });
        });
        return () => { cancelled = true; };
    }, [id, token, fetchIncident]);

    const incident = currentIncident?._id === id ? currentIncident : null;
    const status = result.id !== id ? 'loading' : result.ok ? 'ready' : 'error';

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <main className="pt-24 pb-16 px-4 sm:px-6 max-w-3xl mx-auto">
                <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {status === 'loading' && !incident && <Loading text="Loading incident..." />}

                {status === 'error' && !incident && (
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold mb-2">Incident not found</h1>
                        <p className="text-gray-400 mb-6">It may have been removed.</p>
                        <Link to="/dashboard" className="text-blue-400 hover:underline">Go to the live feed</Link>
                    </div>
                )}

                {incident && (
                    <article className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
                        <h1 className="text-2xl md:text-3xl font-black mb-6">{incident.title}</h1>
                        <IncidentDetails incident={incident} onDeleted={() => navigate('/dashboard')} />
                    </article>
                )}
            </main>
        </div>
    );
};

export default IncidentDetailPage;
