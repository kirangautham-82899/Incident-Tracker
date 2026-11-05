import React from 'react';
import { BarChart3 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';

const AnalyticsPage = () => (
    <div className="min-h-screen bg-slate-950 text-white">
        <Navbar />
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="w-9 h-9 text-blue-500" />
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        Safety <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Analytics</span>
                    </h1>
                </div>
                <p className="text-gray-400 text-sm">Incident volume, response performance and hotspots, updated in real time.</p>
            </div>
            <AnalyticsPanel />
        </div>
    </div>
);

export default AnalyticsPage;
