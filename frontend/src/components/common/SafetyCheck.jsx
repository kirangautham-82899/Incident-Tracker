import React, { useState } from 'react';
import { Shield, MapPin, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SafetyCheck = ({ className = '' }) => {
    const [checking, setChecking] = useState(false);
    const [result, setResult] = useState(null);
    const [showDetails, setShowDetails] = useState(false);

    const calculateSafetyScore = (incidents) => {
        if (incidents.length === 0) {
            return { score: 100, level: 'safe', message: 'No incidents reported in your area' };
        }

        let riskScore = 0;

        // Count by severity
        const criticalCount = incidents.filter(i => i.severity === 'critical').length;
        const highCount = incidents.filter(i => i.severity === 'high').length;
        const mediumCount = incidents.filter(i => i.severity === 'medium').length;

        // Calculate risk (higher = more dangerous)
        riskScore += criticalCount * 30;
        riskScore += highCount * 15;
        riskScore += mediumCount * 5;

        // Active incidents are riskier
        const activeCount = incidents.filter(i => i.status !== 'resolved').length;
        riskScore += activeCount * 10;

        // Convert to safety score (0-100, higher = safer)
        const safetyScore = Math.max(0, 100 - riskScore);

        let level, message;
        if (safetyScore >= 70) {
            level = 'safe';
            message = `Area is relatively safe. ${incidents.length} incident${incidents.length > 1 ? 's' : ''} nearby.`;
        } else if (safetyScore >= 40) {
            level = 'caution';
            message = `Exercise caution. ${activeCount} active incident${activeCount > 1 ? 's' : ''} in the area.`;
        } else {
            level = 'unsafe';
            message = `Area has elevated risk. ${criticalCount + highCount} serious incident${criticalCount + highCount > 1 ? 's' : ''} nearby.`;
        }

        return { score: safetyScore, level, message, incidents };
    };

    const checkSafety = async () => {
        setChecking(true);
        setResult(null);
        setShowDetails(false); // Hide details panel while checking

        if (!navigator.geolocation) {
            toast.error('Geolocation not supported');
            setChecking(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const response = await api.get('/incidents/nearby', {
                        params: {
                            latitude,
                            longitude,
                            maxDistance: 2000 // 2km radius
                        }
                    });

                    const safetyResult = calculateSafetyScore(response.data.data);
                    setResult(safetyResult);
                    setShowDetails(true);
                } catch (error) {
                    toast.error('Failed to check safety status');
                    console.error(error);
                } finally {
                    setChecking(false);
                }
            },
            () => {
                toast.error('Could not get your location');
                setChecking(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const getLevelColor = (level) => {
        switch (level) {
            case 'safe': return 'from-green-500 to-emerald-600';
            case 'caution': return 'from-yellow-500 to-orange-500';
            case 'unsafe': return 'from-red-500 to-rose-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    const getLevelIcon = (level) => {
        switch (level) {
            case 'safe': return CheckCircle;
            case 'caution': return AlertTriangle;
            case 'unsafe': return XCircle;
            default: return Shield;
        }
    };

    return (
        <div className={`${className}`}>
            {!showDetails ? (
                <button
                    onClick={checkSafety}
                    disabled={checking}
                    className="group relative flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {checking ? (
                        <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Checking Your Area...</span>
                        </>
                    ) : (
                        <>
                            <Shield className="w-5 h-5" />
                            <span>Am I Safe?</span>
                            <MapPin className="w-4 h-4 opacity-70" />
                        </>
                    )}
                </button>
            ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4">
                    {/* Safety Score */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {React.createElement(getLevelIcon(result.level), {
                                className: `w-8 h-8 ${result.level === 'safe' ? 'text-green-400' :
                                    result.level === 'caution' ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`
                            })}
                            <div>
                                <h3 className="text-xl font-bold text-white">
                                    {result.level === 'safe' ? 'Area Safe' :
                                        result.level === 'caution' ? 'Exercise Caution' :
                                            'High Risk Area'}
                                </h3>
                                <p className="text-sm text-gray-400">{result.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Safety Score Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Safety Score</span>
                            <span className="font-bold text-white">{Math.round(result.score)}/100</span>
                        </div>
                        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full bg-gradient-to-r ${getLevelColor(result.level)} transition-all duration-500`}
                                style={{ width: `${result.score}%` }}
                            />
                        </div>
                    </div>

                    {/* Nearby Incidents */}
                    {result.incidents && result.incidents.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-300">
                                {result.incidents.length} Incident{result.incidents.length > 1 ? 's' : ''} within 2km:
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {result.incidents.slice(0, 5).map((incident, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 p-2 bg-slate-700/50 rounded-lg text-xs"
                                    >
                                        <span className={`px-2 py-1 rounded font-bold ${incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                                            incident.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {incident.type}
                                        </span>
                                        <span className="text-gray-300 truncate">{incident.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={checkSafety}
                        className="w-full py-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Refresh Safety Check
                    </button>
                </div>
            )}
        </div>
    );
};

export default SafetyCheck;
