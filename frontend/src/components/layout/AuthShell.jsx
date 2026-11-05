import React from 'react';
import { motion } from 'motion/react';
import { PageTransition, EASE } from '../ui/motion';

// Split layout for login/sign-up: form on paper, editorial ink panel on the right
const AuthShell = ({ eyebrow, title, accent, subtitle, children, footer, quote }) => (
    <PageTransition className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
        <div className="flex items-center px-5 py-12 sm:px-8">
            <div className="mx-auto w-full max-w-sm">
                <p className="eyebrow mb-4">{eyebrow}</p>
                <h1 className="text-4xl font-semibold leading-tight tracking-tightest">
                    {title} <span className="font-serif font-normal italic text-ink-soft">{accent}</span>
                </h1>
                <p className="mt-3 text-ink-muted">{subtitle}</p>
                <div className="mt-10">{children}</div>
                {footer && <div className="mt-8 border-t border-line pt-6 text-sm text-ink-muted">{footer}</div>}
            </div>
        </div>

        <div className="relative hidden overflow-hidden bg-ink lg:block">
            {/* Concentric "signal" rings */}
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                {[0, 1, 2, 3, 4].map(i => (
                    <motion.span
                        key={i}
                        className="absolute rounded-full border border-paper/10"
                        style={{ width: 160 + i * 140, height: 160 + i * 140 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.2, ease: EASE, delay: 0.1 * i }}
                    />
                ))}
                <span className="relative h-4 w-4 rounded-full bg-signal" />
                <span className="absolute h-4 w-4 animate-pulse-dot rounded-full bg-signal" />
            </div>
            <motion.blockquote
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.3 }}
                className="absolute inset-x-12 bottom-14"
            >
                <p className="font-serif text-3xl italic leading-snug text-paper">{quote}</p>
                <footer className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/40">Incident Tracker</footer>
            </motion.blockquote>
        </div>
    </PageTransition>
);

export default AuthShell;
