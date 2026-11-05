import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User as UserIcon, CheckCircle, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, Activity, Globe } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const SignupPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [focusedField, setFocusedField] = useState('');
    const { register, isLoading } = useAuthStore();

    const passwordStrength = (() => {
        const pass = formData.password;
        let strength = 0;
        if (pass.length >= 8) strength++;
        if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
        if (/\d/.test(pass)) strength++;
        if (/[^a-zA-Z\d]/.test(pass)) strength++;
        return strength;
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        if (passwordStrength < 2) {
            toast.error('Please use a stronger password');
            return;
        }

        const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password
        });

        if (result.success) {
            toast.success('Welcome to Incident Tracker!');
            navigate('/dashboard');
        } else {
            toast.error(result.error || 'Registration failed');
        }
    };

    const getStrengthColor = () => {
        if (passwordStrength <= 1) return 'from-red-500 to-orange-500';
        if (passwordStrength === 2) return 'from-yellow-500 to-amber-500';
        if (passwordStrength === 3) return 'from-blue-500 to-cyan-500';
        return 'from-green-500 to-emerald-500';
    };

    const getStrengthText = () => {
        if (passwordStrength <= 1) return 'Weak';
        if (passwordStrength === 2) return 'Fair';
        if (passwordStrength === 3) return 'Good';
        return 'Strong';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoMnYyaC0ydi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yem0wIDEwaDJ2Mmgtdi0yem0wLTEwaDF2Mmgtdi0yeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>

            <div className="relative min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-6xl flex items-center gap-12">
                    {/* Left Side - Branding */}
                    <div className="hidden lg:flex lg:flex-1 flex-col justify-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-3 border border-white/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="text-white font-semibold tracking-wide">Registration Open</span>
                            </div>

                            <h1 className="text-6xl font-black text-white leading-tight">
                                Join the <br />
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    Incident Tracker
                                </span>
                            </h1>

                            <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                                Become a part of the network. Report incidents, verify data, and help keep your community safe with real-time intelligence.
                            </p>

                            <div className="flex gap-4 pt-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <ShieldCheck className="w-8 h-8 text-blue-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Verified Identity</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Activity className="w-8 h-8 text-green-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Instant Access</div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Globe className="w-8 h-8 text-purple-400 mb-2" />
                                    <div className="text-sm font-bold text-gray-200">Community Driven</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="flex-1 max-w-md w-full">
                        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)] relative overflow-hidden group">

                            {/* Scanning Light Effect */}
                            <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[scan_3s_linear_infinite]"></div>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-slate-800 rounded-2xl mb-4 shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
                                    <UserPlus className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2">Create Account</h2>
                                <p className="text-gray-400">Initialize your user profile</p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Full Name</label>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <UserIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'name' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Email Address</label>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'email' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type="email"
                                            placeholder="you@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-4 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Password</label>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'password' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
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

                                    {/* Password Strength Indicator */}
                                    {formData.password && (
                                        <div className="mt-2 space-y-2">
                                            <div className="flex gap-1.5 h-1">
                                                {[1, 2, 3, 4].map((level) => (
                                                    <div
                                                        key={level}
                                                        className={`flex-1 rounded-full transition-all duration-500 ${level <= passwordStrength
                                                            ? `bg-gradient-to-r ${getStrengthColor()} shadow-sm`
                                                            : 'bg-white/5'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider">
                                                <span className="text-gray-500">Security Level:</span>
                                                <span className={passwordStrength >= 3 ? 'text-green-400' : passwordStrength >= 2 ? 'text-yellow-400' : 'text-red-400'}>{getStrengthText()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Confirm Password</label>
                                    <div className={`relative transition-all duration-300 group ${focusedField === 'confirm' ? 'scale-[1.02]' : ''}`}>
                                        <div className={`absolute inset-0 bg-blue-500/20 rounded-xl blur transition-opacity ${focusedField === 'confirm' ? 'opacity-100' : 'opacity-0'}`}></div>
                                        <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${focusedField === 'confirm' ? 'text-blue-400' : 'text-gray-500'}`} />
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm password"
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            onFocus={() => setFocusedField('confirm')}
                                            onBlur={() => setFocusedField('')}
                                            className="relative w-full pl-12 pr-12 py-3.5 bg-slate-950/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all font-mono"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                        {formData.confirmPassword && (
                                            <div className="absolute right-12 top-1/2 -translate-y-1/2 z-10">
                                                {formData.password === formData.confirmPassword ? (
                                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <AlertCircle className="w-5 h-5 text-red-400" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400">
                                    New accounts are citizen accounts. Responder and admin access is granted by an administrator.
                                </p>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group w-full mt-4 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="text-lg tracking-wide">Register Account</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="mt-6 text-center">
                                <p className="text-gray-400">
                                    Already have an account?{' '}
                                    <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                        Sign In
                                    </Link>
                                </p>
                            </div>

                        </div>

                        {/* Trust Badges */}
                        <div className="mt-6 flex items-center justify-center gap-6 text-gray-500 text-xs font-mono uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Encrypted</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                                <span>Verified</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
