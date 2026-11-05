import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Globe } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const { login, isLoading } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(formData);

        if (result.success) {
            toast.success(`Welcome back, ${result.user.name}!`);
            const staff = ['admin', 'responder'].includes(result.user.role);
            navigate(location.state?.from || (staff ? '/admin' : '/dashboard'), { replace: true });
        } else {
            toast.error(result.error || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-40 right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-40 left-1/3 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoMnYyaC0ydi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

            <div className="relative min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-6xl flex items-center gap-12">
                    {/* Left Side - Branding (Hidden on mobile) */}
                    <div className="hidden lg:flex lg:flex-1 flex-col justify-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-white font-semibold tracking-wide">Platform Operational</span>
                            </div>

                            <h1 className="text-6xl font-black text-white leading-tight">
                                Welcome Back to <br />
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    Incident Tracker
                                </span>
                            </h1>

                            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                                Access the centralized dashboard to manage incidents, coordinate resources, and view real-time analytics.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <ShieldCheck className="w-8 h-8 text-blue-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Secure Environment</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Activity className="w-8 h-8 text-green-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Real-time Updates</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Globe className="w-8 h-8 text-purple-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Centralized Data</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Login Form */}
                    <div className="flex-1 max-w-md w-full">
                        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] relative overflow-hidden group">

                            {/* Scanning Light Effect */}
                            <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[scan_3s_linear_infinite]"></div>

                            {/* Header */}
                            <div className="text-center mb-10">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl mb-6 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                                    <LogIn className="w-10 h-10 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Account Login</h2>
                                <p className="text-gray-400">Please sign in to continue to your dashboard</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Email Field */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type="email"
                                            placeholder="commander@incident-tracker.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Password</label>
                                        
                                    </div>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="••••••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-12 py-4 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="text-lg tracking-wide">Sign In</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer Links */}
                            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                <p className="text-gray-400">
                                    Don't have an account?{' '}
                                    <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                        Create Account
                                    </Link>
                                </p>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
