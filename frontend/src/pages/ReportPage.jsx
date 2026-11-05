import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import IncidentReportForm from '../components/incident/IncidentReportForm';

const ReportPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden">
            <Navbar />

            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px]" />
            </div>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 pt-24">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-6">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Responders are notified in real time
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
                        Report an <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Incident</span>
                    </h1>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Tell us what happened and where. Your report appears on the live feed and map immediately.
                    </p>
                </div>

                <div className="p-6 md:p-8 border border-white/10 bg-slate-800/50 backdrop-blur-xl rounded-3xl">
                    <IncidentReportForm
                        onClose={() => navigate(-1)}
                        onSubmitted={(incident) => navigate(`/incident/${incident._id}`)}
                    />
                </div>
            </main>
        </div>
    );
};

export default ReportPage;
