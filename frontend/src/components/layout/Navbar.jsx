import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, Plus, LogOut, User } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import { isStaff } from '../../utils/constants';
import { Button, cx } from '../ui';
import { EASE } from '../ui/motion';
import SOSButton from '../common/SOSButton';

export const Logo = ({ className = '' }) => (
    <Link to="/" className={cx('group flex items-center gap-2.5', className)} aria-label="Incident Tracker home">
        <span className="relative flex h-7 w-7 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-signal/15 transition-transform duration-500 ease-out group-hover:scale-125" />
            <span className="relative h-2.5 w-2.5 rounded-full bg-signal" />
            <span className="absolute h-2.5 w-2.5 animate-pulse-dot rounded-full bg-signal" />
        </span>
        <span className="font-display text-[17px] font-semibold tracking-tight">
            Incident<span className="font-serif text-[19px] font-normal italic text-ink-soft">tracker</span>
        </span>
    </Link>
);

const NAV_LINKS = [
    { to: '/dashboard', label: 'Live feed' },
    { to: '/map', label: 'Map' },
    { to: '/analytics', label: 'Analytics' }
];

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuthStore();
    // Menus remember the path they were opened on, so navigating closes them
    const [openOn, setOpenOn] = useState(null);
    const [menuOpenOn, setMenuOpenOn] = useState(null);
    const open = openOn === location.pathname;
    const menuOpen = menuOpenOn === location.pathname;
    const setOpen = (fn) => setOpenOn(prev => ((typeof fn === 'function' ? fn(prev === location.pathname) : fn) ? location.pathname : null));
    const setMenuOpen = (fn) => setMenuOpenOn(prev => ((typeof fn === 'function' ? fn(prev === location.pathname) : fn) ? location.pathname : null));
    const [scrolled, setScrolled] = useState(false);
    const menuRef = useRef(null);

    const links = isStaff(user) ? [...NAV_LINKS, { to: '/admin', label: 'Command' }] : NAV_LINKS;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close the account menu on outside click
    useEffect(() => {
        if (!menuOpen) return undefined;
        const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOpenOn(null);
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [menuOpen]);

    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header
            className={cx(
                'sticky top-0 z-[1100] transition-[background-color,border-color,backdrop-filter] duration-300',
                scrolled || open ? 'border-b border-line bg-paper/85 backdrop-blur-xl' : 'border-b border-transparent bg-paper/0'
            )}
        >
            <nav className="mx-auto flex h-16 max-w-page items-center justify-between gap-6 px-5 sm:px-8" aria-label="Main">
                <Logo />

                <div className="hidden items-center gap-1 lg:flex">
                    {links.map(link => (
                        <NavLink key={link.to} to={link.to} className="relative px-3.5 py-2 text-sm font-medium">
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-paper-deep"
                                            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                                        />
                                    )}
                                    <span className={cx('relative transition-colors', isActive ? 'text-ink' : 'text-ink-muted hover:text-ink')}>
                                        {link.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="hidden items-center gap-2 lg:flex">
                    {isAuthenticated && <SOSButton />}
                    <Button to="/report" size="sm" variant="primary">
                        <Plus className="h-4 w-4" /> Report
                    </Button>
                    {isAuthenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen(v => !v)}
                                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold text-paper transition-transform hover:scale-105"
                                aria-label="Account menu"
                                aria-expanded={menuOpen}
                            >
                                {user?.name?.charAt(0).toUpperCase()}
                            </button>
                            <AnimatePresence>
                                {menuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                        transition={{ duration: 0.18, ease: EASE }}
                                        className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl bg-white p-2 shadow-[0_24px_60px_-20px_rgba(22,22,26,0.35)] ring-1 ring-line"
                                    >
                                        <div className="px-3 py-2.5">
                                            <div className="truncate text-sm font-semibold">{user?.name}</div>
                                            <div className="truncate text-[13px] text-ink-muted">{user?.email}</div>
                                        </div>
                                        <div className="my-1 h-px bg-line" />
                                        <Link to="/profile" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-paper-deep hover:text-ink">
                                            <User className="h-4 w-4" /> Profile & reports
                                        </Link>
                                        <button onClick={handleLogout} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-soft hover:bg-paper-deep hover:text-ink">
                                            <LogOut className="h-4 w-4" /> Sign out
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="link-underline px-2 text-sm font-medium text-ink-soft hover:text-ink">Log in</Link>
                            <Button to="/signup" size="sm" variant="outline">Sign up</Button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    {isAuthenticated && <SOSButton compact />}
                    <button
                        onClick={() => setOpen(v => !v)}
                        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-paper-deep"
                        aria-label={open ? 'Close menu' : 'Open menu'}
                        aria-expanded={open}
                    >
                        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile full-screen menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-x-0 bottom-0 top-16 z-[1100] overflow-y-auto bg-paper lg:hidden"
                    >
                        <motion.ul
                            initial="hidden"
                            animate="show"
                            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                            className="px-5 pt-6"
                        >
                            {[...links, { to: '/report', label: 'Report an incident' }, ...(isAuthenticated ? [{ to: '/profile', label: 'Profile' }] : [])].map(link => (
                                <motion.li
                                    key={link.to}
                                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } } }}
                                    className="border-b border-line"
                                >
                                    <Link
                                        to={link.to}
                                        className={cx('flex items-center justify-between py-5 font-display text-3xl font-semibold tracking-tight', location.pathname === link.to ? 'text-signal' : 'text-ink')}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.li>
                            ))}
                        </motion.ul>
                        <div className="px-5 py-8">
                            {isAuthenticated ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold">{user?.name}</div>
                                        <div className="text-sm text-ink-muted">{user?.email}</div>
                                    </div>
                                    <Button variant="outline" onClick={handleLogout}><LogOut className="h-4 w-4" /> Sign out</Button>
                                </div>
                            ) : (
                                <div className="flex gap-3">
                                    <Button to="/login" variant="outline" className="flex-1">Log in</Button>
                                    <Button to="/signup" className="flex-1">Sign up</Button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Navbar;
