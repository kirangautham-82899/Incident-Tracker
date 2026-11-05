import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Navbar';

const COLUMNS = [
    { title: 'Product', links: [['/dashboard', 'Live feed'], ['/map', 'Incident map'], ['/analytics', 'Analytics'], ['/report', 'Report an incident']] },
    { title: 'Account', links: [['/login', 'Log in'], ['/signup', 'Create account'], ['/profile', 'Profile'], ['/admin', 'Responder console']] },
    { title: 'About', links: [['/contact', 'Contact'], ['/privacy', 'Privacy'], ['/terms', 'Terms']] }
];

const Footer = () => (
    <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-page gap-12 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <div className="max-w-xs">
                <Logo />
                <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                    Community-powered incident reporting. Report what you see, confirm what others see, and help responders act faster.
                </p>
                <p className="mt-5 text-[13px] font-medium text-signal">
                    In a life-threatening emergency, call 112 / 911 first.
                </p>
            </div>
            {COLUMNS.map(col => (
                <div key={col.title}>
                    <h3 className="eyebrow mb-4">{col.title}</h3>
                    <ul className="space-y-2.5">
                        {col.links.map(([to, label]) => (
                            <li key={to}>
                                <Link to={to} className="link-underline text-sm text-ink-soft hover:text-ink">{label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
        <div className="border-t border-line">
            <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-3 px-5 py-6 text-[13px] text-ink-faint sm:px-8">
                <span>© {new Date().getFullYear()} Incident Tracker</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em]">Built for faster response</span>
            </div>
        </div>
    </footer>
);

export default Footer;
