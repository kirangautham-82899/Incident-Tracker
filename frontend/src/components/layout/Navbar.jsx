import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Siren, Menu, X, LogOut, Plus, Shield, ChevronRight, Activity, Map as MapIcon, BarChart3, Radio } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { isStaff } from '../../utils/constants';

import Button from '../common/Button';
import SOSButton from '../common/SOSButton';

const Navbar = ({ transparent = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { isAuthenticated, user, logout } = useAuthStore();

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/');
    };

    const go = (to) => {
        setIsMenuOpen(false);
        navigate(to);
    };

    // Determine navbar styling based on state
    const isTransparent = transparent && !scrolled && !isMenuOpen;

    const navClasses = `fixed w-full top-0 z-50 transition-all duration-300 ${isTransparent
        ? 'bg-transparent border-transparent py-4'
        : 'bg-slate-900/80 backdrop-blur-xl shadow-lg border-b border-white/10 py-2'
        } `;

    const textClass = isTransparent ? 'text-white' : 'text-gray-100';
    const subTextClass = isTransparent ? 'text-blue-200' : 'text-gray-400';

    // Plain render helper (not a component) so it isn't re-created as a new component type each render
    const navLink = (to, children, Icon) => {
        const isActive = location.pathname === to;
        return (
            <Link
                to={to}
                className={`flex items-center gap-2 text-sm font-medium transition-all px-3 py-2 rounded-lg group
                    ${isActive
                        ? 'text-blue-400 bg-blue-500/10'
                        : `${textClass} hover:text-blue-400 hover:bg-white/5`
                    } `}
            >
                {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-blue-400'} transition-colors`} />}
                {children}
            </Link>
        );
    };

    return (
        <nav className={navClasses}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand Logo - Animated */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity rounded-full"></div>
                            <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg border border-white/10 transform group-hover:scale-105 transition-transform duration-300">
                                <Siren className="w-6 h-6 text-white animate-pulse" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-ping"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div>
                            <h1 className={`text-xl font-black tracking-tight ${textClass} group-hover:text-blue-400 transition-colors`}>
                                Incident<span className="text-blue-500">Tracker</span>
                            </h1>
                            <p className={`text-[10px] uppercase tracking-widest font-semibold ${subTextClass}`}>Live Response</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-2">


                        {isAuthenticated && <SOSButton />}

                        {navLink('/dashboard', 'Live Feed', Activity)}
                        {navLink('/map', 'Map', MapIcon)}
                        {navLink('/analytics', 'Analytics', BarChart3)}
                        {isStaff(user) && navLink('/admin', 'Command', Radio)}

                        <div className="h-6 w-px bg-white/10 mx-2"></div>

                        {isAuthenticated ? (
                            <div className="flex items-center gap-3">
                                <Link to="/profile" title="My profile" className="flex items-center gap-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <span className={`text-sm font-medium ${textClass}`}>{user?.name}</span>
                                </Link>

                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate('/report')}
                                    className="shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
                                >
                                    <Plus className="w-4 h-4" />
                                    Report
                                </Button>

                                <button
                                    onClick={handleLogout}
                                    className={`p-2 rounded-lg hover:bg-white/10 transition-colors ${textClass}`}
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <Link to="/login">
                                    <button className={`px-4 py-2 text-sm font-semibold transition-colors ${textClass} hover:text-blue-400`}>
                                        Login
                                    </button>
                                </Link>
                                <Link to="/signup">
                                    <button className="group relative px-5 py-2 rounded-lg bg-blue-600 overflow-hidden transition-all hover:bg-blue-500 shadow-lg shadow-blue-500/25">
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                        <span className="relative flex items-center gap-2 text-white font-bold text-sm">
                                            Get Started
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`lg:hidden p-2 rounded-xl transition-all ${isMenuOpen ? 'bg-white/10 text-white' : `${textClass} hover:bg-white/10`
                            } `}
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            <div className={`lg:hidden absolute w-full bg-slate-900/95 backdrop-blur-xl border-t border-white/10 transition-all duration-300 ease-in-out origin-top ${isMenuOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0'
                } `}>
                <div className="px-4 py-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        {[['/dashboard', 'Live Feed'], ['/map', 'Map'], ['/analytics', 'Analytics'], ['/report', 'Report Incident'], ...(isStaff(user) ? [['/admin', 'Command']] : [])].map(([to, label]) => (
                            <button key={to} onClick={() => go(to)} className={`p-3 rounded-xl text-sm font-medium border border-white/10 ${location.pathname === to ? 'bg-blue-500/20 text-blue-300' : 'text-gray-200 hover:bg-white/5'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {isAuthenticated ? (
                        <>
                            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                    {user?.name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-white font-bold">{user?.name}</p>
                                    <p className="text-xs text-gray-400">{user?.email}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button fullWidth variant="primary" onClick={() => go('/report')}>
                                    <Plus className="w-4 h-4" /> Report
                                </Button>
                                <Button fullWidth variant="secondary" onClick={() => go('/profile')}>
                                    Profile
                                </Button>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                            >
                                <LogOut className="w-5 h-5" /> Sign Out
                            </button>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                                <button className="w-full p-3 text-gray-300 font-medium hover:text-white transition-colors">
                                    Log In
                                </button>
                            </Link>
                            <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                                <button className="w-full p-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                    Get Started Now <ChevronRight className="w-4 h-4" />
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
