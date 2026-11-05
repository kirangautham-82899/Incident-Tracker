import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Shield,
    Clock,
    MapPin,
    Users,
    ArrowRight,
    Activity,
    CheckCircle,
    Siren,
    Smartphone,
    Globe,
    Quote,
    Flame,
    Stethoscope,
    Car,
    X,
    AlertTriangle,
    Zap,
    Sparkles,
    Mic,
    BarChart3,
    Bell,
    MessageSquare,
    TrendingUp,
    Radio
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';

// Tech Radar & Live Log Component
const LiveIncidentDemo = () => {
    const [incidents, setIncidents] = useState([]);


    // Simulated live feed data stream
    useEffect(() => {
        const types = [
            { type: 'Fire', color: 'text-orange-500', icon: <Flame className="w-4 h-4" /> },
            { type: 'Medical', color: 'text-blue-500', icon: <Stethoscope className="w-4 h-4" /> },
            { type: 'Accident', color: 'text-red-500', icon: <Car className="w-4 h-4" /> },
            { type: 'Hazard', color: 'text-yellow-500', icon: <AlertTriangle className="w-4 h-4" /> }
        ];

        const locations = ["Central St", "Main Ave", "Broadway", "5th Ave", "Market St", "Park Ln"];

        const interval = setInterval(() => {
            const newIncident = {
                id: Math.floor(Math.random() * 9000) + 1000,
                ...types[Math.floor(Math.random() * types.length)],
                location: `${locations[Math.floor(Math.random() * locations.length)]}`,
                time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                verified: Math.random() > 0.5
            };

            setIncidents(prev => [newIncident, ...prev].slice(0, 5));
        }, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full flex flex-col md:flex-row gap-6 items-center justify-center p-4">

            {/* Radar Scanner */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
                {/* Outer Rings */}
                <div className="absolute inset-0 rounded-full border border-blue-500/30"></div>
                <div className="absolute inset-4 rounded-full border border-dashed border-blue-500/20 animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-8 rounded-full border border-blue-500/10"></div>

                {/* Scanning Line */}
                <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="w-1/2 h-1/2 bg-gradient-to-br from-blue-500/40 to-transparent absolute top-0 left-0 origin-bottom-right animate-spin" style={{ animationDuration: '4s', borderRadius: '100% 0 0 0' }}></div>
                </div>

                {/* Central Hub */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-900/50 backdrop-blur rounded-full border border-blue-400 flex items-center justify-center shadow-[0_0_30px_#3b82f6]">
                        <Globe className="w-8 h-8 text-blue-300 animate-pulse" />
                    </div>
                </div>

                {/* Random Blips */}
                {incidents.map((inc, i) => (
                    <div key={inc.id}
                        className="absolute w-3 h-3 bg-red-500 rounded-full animate-ping"
                        style={{
                            top: `${50 + (Math.sin(i) * 40)}%`,
                            left: `${50 + (Math.cos(i) * 40)}%`,
                            animationDuration: '2s',
                            animationDelay: `${i * 0.5}s`
                        }}
                    ></div>
                ))}
            </div>

            {/* Live Data Feed Terminal */}
            <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur rounded-xl border border-blue-500/30 overflow-hidden shadow-2xl">
                <div className="bg-slate-800/50 px-4 py-2 flex justify-between items-center border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-mono text-blue-300">LIVE_FEED_V2.0</span>
                    </div>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    </div>
                </div>

                <div className="p-4 space-y-3 font-mono text-sm max-h-[300px] overflow-hidden relative">
                    {/* Scanlines Effect */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(transparent_50%,rgba(0,0,0,1)_50%)] bg-[length:100%_4px]"></div>

                    {incidents.map((inc, idx) => (
                        <div key={inc.id} className={`flex items-center gap-3 animate-fadeIn ${idx === 0 ? 'bg-white/5 -mx-2 px-2 py-1 rounded' : 'opacity-70'}`}>
                            <span className="text-gray-500 text-xs">[{inc.time}]</span>
                            <div className={`${inc.color}`}>{inc.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div className="truncate font-bold text-gray-300">{inc.type.toUpperCase()} DETECTED</div>
                                <div className="text-xs text-gray-500 truncate">Loc: {inc.location}</div>
                            </div>
                            {inc.verified && (
                                <Shield className="w-3 h-3 text-green-500 flex-shrink-0" />
                            )}
                        </div>
                    ))}

                    {incidents.length === 0 && (
                        <div className="text-center text-gray-500 py-4 animate-pulse">
                            CONNECTING TO SATELLITE...
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

// Interactive How It Works Component
const HowItWorks = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const steps = [
        {
            id: 1,
            title: "Report Incident",
            desc: "Spot an issue? Open the app, take a photo, and our AI automatically detects the location and type.",
            icon: <Smartphone className="w-6 h-6" />,
            color: "blue",
            screen: (
                <div className="flex flex-col h-full bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>

                    <div className="relative flex-1 p-6 flex flex-col items-center justify-center">
                        <div className="w-48 h-48 border-2 border-dashed border-blue-500 rounded-2xl flex items-center justify-center relative bg-slate-800/50 backdrop-blur-sm">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 -mt-1 -ml-1"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 -mt-1 -mr-1"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 -mb-1 -ml-1"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 -mb-1 -mr-1"></div>
                            <Flame className="w-12 h-12 text-orange-500 animate-pulse" />
                        </div>
                        <div className="mt-4 px-4 py-2 bg-slate-800 rounded-full text-xs font-mono text-blue-300">
                            AI Detecting: Fire (98%)
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 border-t border-white/10">
                        <div className="w-full py-3 bg-blue-600 rounded-xl flex items-center justify-center gap-2 font-bold text-sm shadow-lg shadow-blue-600/20">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                            Submit Report
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: "Community Verify",
            desc: "Nearby users receive alerts. They verify the report to filter out false alarms and ensure data accuracy.",
            icon: <CheckCircle className="w-6 h-6" />,
            color: "purple",
            screen: (
                <div className="flex flex-col h-full bg-slate-900 p-6 relative overflow-hidden">
                    <div className="bg-slate-800 rounded-2xl p-4 border border-white/10 shadow-xl mb-4 transform transition-all hover:scale-105">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                                <Flame className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Structure Fire</h4>
                                <p className="text-xs text-gray-400">0.2 miles away • 2 mins ago</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        <p className="text-center text-gray-400 text-xs mb-4">Is this happening now?</p>
                        <div className="flex gap-3">
                            <button className="flex-1 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 font-bold text-sm hover:bg-green-500/20 transition-colors flex flex-col items-center gap-1 group">
                                <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Yes (12)
                            </button>
                            <button className="flex-1 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm hover:bg-red-500/20 transition-colors flex flex-col items-center gap-1 group">
                                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                No (0)
                            </button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: "Quick Resolution",
            desc: "Emergency services are dispatched instantly. Responders use live data to navigate and resolve the situation.",
            icon: <Shield className="w-6 h-6" />,
            color: "pink",
            screen: (
                <div className="flex flex-col h-full bg-slate-900 relative">
                    <div className="absolute inset-0 bg-slate-800">
                        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-4 border-blue-500/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>

                        <svg className="absolute inset-0 w-full h-full p-8" style={{ filter: 'drop-shadow(0 0 4px #3b82f6)' }}>
                            <path d="M 50 250 Q 150 150 250 100" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="10 10" className="animate-pulse" />
                        </svg>

                        <div className="absolute top-[100px] right-[50px] w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/50 z-10 animate-bounce">
                            <Flame className="w-4 h-4 text-white" />
                        </div>

                        <div className="absolute bottom-[50px] left-[50px] w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 z-10">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-green-500/30 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <div>
                                <h4 className="font-bold text-white text-sm">Responders En Route</h4>
                                <p className="text-xs text-green-400">ETA: 3 minutes</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
    ];

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isPaused, steps.length]);

    return (
        <div className="py-24 bg-slate-900 relative overflow-hidden">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-${steps[activeStep].color}-500/5 rounded-full blur-3xl transition-colors duration-1000 pointer-events-none`}></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <span className="text-blue-400 font-semibold tracking-wider uppercase text-sm">Seamless Coordinator</span>
                    <h2 className="text-4xl md:text-5xl font-bold mt-2 mb-4">How It Works</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    <div className="space-y-6">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`relative p-6 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group
                              ${activeStep === idx
                                        ? 'bg-white/5 border border-white/10 shadow-2xl scale-105'
                                        : 'hover:bg-white/5 border border-transparent opacity-60 hover:opacity-100'}`}
                                onClick={() => setActiveStep(idx)}
                                onMouseEnter={() => { setActiveStep(idx); setIsPaused(true); }}
                                onMouseLeave={() => setIsPaused(false)}
                            >
                                {activeStep === idx && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-[4000ms] ease-linear w-full"></div>
                                )}

                                <div className="flex gap-6 items-start">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300
                                  ${activeStep === idx ? `bg-${step.color}-500 text-white shadow-lg shadow-${step.color}-500/30` : 'bg-slate-800 text-gray-400 group-hover:bg-slate-700'}`}>
                                        {step.icon}
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold mb-2 transition-colors ${activeStep === idx ? 'text-white' : 'text-gray-300'}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed text-sm">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Device Mockups */}
                    <div className="relative flex justify-center lg:justify-end gap-8 flex-wrap lg:flex-nowrap">
                        {/* Desktop Mockup */}
                        <div className="hidden xl:block relative w-[500px] h-[320px] bg-slate-900 rounded-2xl border-4 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10 transform transition-transform duration-500 hover:scale-[1.02]">
                            {/* Browser Chrome */}
                            <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 border-b border-white/10 flex items-center px-3 gap-2 z-20">
                                <div className="flex gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                </div>
                                <div className="flex-1 mx-4 h-5 bg-slate-700 rounded-md flex items-center px-2">
                                    <span className="text-[8px] text-gray-400 font-mono">incidenttracker.app</span>
                                </div>
                            </div>
                            {/* Desktop Screen Content */}
                            <div className="w-full h-full pt-8 bg-slate-900 text-white relative overflow-hidden">
                                <div className="absolute inset-0 transition-opacity duration-500 scale-75 origin-top">
                                    {steps[activeStep].screen}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Mockup */}
                        <div className="relative w-[280px] h-[560px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl overflow-hidden ring-1 ring-white/10 transform transition-transform duration-500 hover:scale-[1.02]">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-2xl z-20"></div>
                            <div className="w-full h-full bg-slate-900 text-white relative">
                                <div className="absolute inset-0 transition-opacity duration-500">
                                    {steps[activeStep].screen}
                                </div>
                                <div className="absolute top-2 right-6 flex gap-1 z-20">
                                    <div className="w-1 h-3 bg-white rounded-full"></div>
                                    <div className="w-1 h-3 bg-white rounded-full"></div>
                                    <div className="w-1 h-3 bg-white/30 rounded-full"></div>
                                </div>
                            </div>
                        </div>

                        {/* Combined Glow Effect */}
                        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] -z-10 rounded-full blur-[100px] opacity-30 transition-colors duration-500 bg-${steps[activeStep].color}-600`}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LandingPage = () => {
    const [isVisible, setIsVisible] = useState(false);
    // Trigger the entrance animation after the first paint

    useEffect(() => {
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-white overflow-x-hidden">
            <Navbar transparent />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-blob" />
                <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[100px] animate-blob animation-delay-4000" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDMwaDJ2MmgtMnYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnptMC0xMGgxdjJoLXYtMnptMCAxMGwydjJoLXYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
            </div>

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-6 sm:px-12 lg:px-20 max-w-8xl mx-auto">
                <div className={`transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 space-y-8 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium animate-fadeIn">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                </span>
                                Now protecting 50+ cities
                            </div>

                            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-tight">
                                Emergency Response <br />
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    Reimagined.
                                </span>
                            </h1>

                            <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                The next generation incident tracking platform. Connects citizens, responders, and communities in real-time. Faster response, verified data, saved lives.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                                <Link to="/signup">
                                    <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all transform hover:scale-105 hover:shadow-blue-500/40 flex items-center gap-2">
                                        Start Reporting
                                        <ArrowRight className="w-5 h-5" />
                                    </button>
                                </Link>
                            </div>

                            <div className="pt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Free for Citizens</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Verified Response</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Visual - Dynamic Component */}
                        <div className="flex-1 w-full max-w-lg lg:max-w-none relative z-10">
                            <LiveIncidentDemo />
                        </div>
                    </div>
                </div>
            </div>

            <HowItWorks />

            {/* Features Grid */}
            <div className="py-24 px-6 md:px-12 lg:px-20 max-w-8xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Features</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to keep your community safe.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Clock className="w-8 h-8 text-blue-400" />,
                            title: "WebSocket Real-Time Sync",
                            desc: "Socket.IO powered live updates. See incidents as they happen with <50ms latency.",
                            badge: "Live"
                        },
                        {
                            icon: <Sparkles className="w-8 h-8 text-purple-400" />,
                            title: "AI-Powered Analysis",
                            desc: "Machine learning detects urgency patterns, auto-categorizes incidents, and predicts severity in real-time.",
                            badge: "AI"
                        },
                        {
                            icon: <Globe className="w-8 h-8 text-pink-400" />,
                            title: "Interactive Heat Maps",
                            desc: "Leaflet.js clustering + density visualization. Identify danger zones at a glance with 2D heatmaps.",
                            badge: "Maps"
                        },
                        {
                            icon: <Shield className="w-8 h-8 text-emerald-400" />,
                            title: "SOS Panic Button",
                            desc: "One-tap emergency broadcast with GPS auto-location. Alerts responders within 3 seconds.",
                            badge: "Safety"
                        },
                        {
                            icon: <Mic className="w-8 h-8 text-cyan-400" />,
                            title: "Voice Command Reporting",
                            desc: "Hands-free incident reporting. Speak your description, AI transcribes and auto-fills the form.",
                            badge: "Voice"
                        },
                        {
                            icon: <BarChart3 className="w-8 h-8 text-orange-400" />,
                            title: "Live Analytics Dashboard",
                            desc: "Real-time charts with Chart.js. Track trends, response times, and incident distribution instantly.",
                            badge: "Analytics"
                        },
                        {
                            icon: <Bell className="w-8 h-8 text-red-400" />,
                            title: "Push Notifications",
                            desc: "Progressive Web App with service workers. Get critical alerts even when offline.",
                            badge: "PWA"
                        },
                        {
                            icon: <MessageSquare className="w-8 h-8 text-indigo-400" />,
                            title: "AI Chatbot Support",
                            desc: "24/7 intelligent assistant. Get instant help, FAQs, and guidance powered by NLP.",
                            badge: "Bot"
                        },
                        {
                            icon: <TrendingUp className="w-8 h-8 text-yellow-400" />,
                            title: "Gamification System",
                            desc: "Earn badges, reputation points, and climb leaderboards. Community engagement meets incentivization.",
                            badge: "Loyalty"
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/5 rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:border-white/10 group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
                                    {feature.icon}
                                </div>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {feature.badge}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-24 bg-gradient-to-b from-slate-900 to-slate-800">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">What People Say</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                text: "Literally saved my neighborhood! 🚨 Got an alert about a fire 2 blocks away - evacuated before it spread. This app is ESSENTIAL.",
                                author: "Priya M.",
                                role: "Resident, Mumbai"
                            },
                            {
                                text: "I reported a pothole at 7 AM, by 9 AM responders were on it! 🛣️ The AI verification is crazy fast. Best civic app I've used.",
                                author: "Rajesh K.",
                                role: "Daily Commuter"
                            },
                            {
                                text: "As an EMT, the real-time incident data + GPS coordinates cut our response time by 40%. Lives are being saved faster! 🚑",
                                author: "Lt. Sharma",
                                role: "Emergency Medical Services"
                            }
                        ].map((quote, idx) => (
                            <div key={idx} className="bg-white/5 p-8 rounded-3xl border border-white/5 relative">
                                <Quote className="w-10 h-10 text-blue-500/20 absolute top-6 right-6" />
                                <p className="text-gray-300 italic mb-6 leading-relaxed">"{quote.text}"</p>
                                <div>
                                    <p className="font-bold text-white">{quote.author}</p>
                                    <p className="text-sm text-blue-400">{quote.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-20 border-y border-white/5 bg-slate-900/50 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
                    {[
                        { value: "12,405", label: "Active Guardians", color: "text-blue-400" },
                        { value: "< 2.5s", label: "Avg Response Latency", color: "text-green-400" },
                        { value: "99.9%", label: "System Uptime", color: "text-purple-400" },
                        { value: "342", label: "Incidents Resolved Today", color: "text-orange-400" }
                    ].map((stat, idx) => (
                        <div key={idx} className="text-center group cursor-default">
                            <div className={`text-4xl md:text-5xl font-mono font-black mb-2 ${stat.color} filter drop-shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                                {stat.value}
                            </div>
                            <div className="text-gray-500 font-mono uppercase tracking-widest text-xs font-bold group-hover:text-gray-400 transition-colors">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="py-16 px-6 border-t border-white/10 bg-slate-950 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl text-white tracking-tight">Incident Tracker</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                            Empowering communities with real-time safety intelligence. Built for the modern world, protecting what matters most.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-mono text-green-400">All Systems Operational</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/map" className="hover:text-blue-400 transition-colors">Live Incident Map</Link></li>
                            <li><Link to="/analytics" className="hover:text-blue-400 transition-colors">Safety Analytics</Link></li>
                            <li><Link to="/report" className="hover:text-blue-400 transition-colors">Submit Report</Link></li>
                            <li><Link to="/admin" className="hover:text-blue-400 transition-colors">Responder Portal</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Legal & Support</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link to="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                            <li><Link to="/contact" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
                            <li><a href="#" className="hover:text-blue-400 transition-colors">API Status</a></li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-gray-600 text-xs font-mono">
                        © 2025 Incident Tracker. Safeguarding Communities.
                    </div>
                    <div className="flex gap-6">
                        {/* Social placeholders */}
                        <a href="#" className="text-gray-600 hover:text-white transition-colors"><Globe className="w-4 h-4" /></a>
                        <a href="#" className="text-gray-600 hover:text-white transition-colors"><MessageSquare className="w-4 h-4" /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
