import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring, useReducedMotion } from 'motion/react';

export const EASE = [0.22, 1, 0.36, 1];

// Whole-page enter animation (used by every route)
export const PageTransition = ({ children, className = '' }) => (
    <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease: EASE }}
        className={className}
    >
        {children}
    </motion.main>
);

/**
 * Fades/slides children in once they reach the viewport. Anything that is in
 * view or already scrolled past is shown, so content is never left invisible
 * when the user jumps (anchor links, fast scroll, back navigation).
 */
export const useRevealed = (offset = 60) => {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);

    useEffect(() => {
        if (shown) return undefined;
        const check = () => {
            const rect = ref.current?.getBoundingClientRect();
            if (rect && rect.top < window.innerHeight - offset) setShown(true);
        };
        check();
        window.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        window.addEventListener('hashchange', check);
        return () => {
            window.removeEventListener('scroll', check);
            window.removeEventListener('resize', check);
            window.removeEventListener('hashchange', check);
        };
    }, [shown, offset]);

    return [ref, shown];
};

export const Reveal = ({ children, delay = 0, y = 16, className = '', as = 'div' }) => {
    const Comp = motion[as] || motion.div;
    const [ref, shown] = useRevealed();
    return (
        <Comp
            ref={ref}
            initial={{ opacity: 0, y }}
            animate={shown ? { opacity: 1, y: 0 } : { opacity: 0, y }}
            transition={{ duration: 0.6, ease: EASE, delay }}
            className={className}
        >
            {children}
        </Comp>
    );
};

// Staggered list container + item
export const staggerParent = {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } }
};
export const staggerItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

// Big headline that rises word by word
export const SplitWords = ({ text, className = '', delay = 0 }) => (
    <span className={className} aria-label={text}>
        {text.split(' ').map((word, i) => (
            <span key={i} className="-mb-[0.14em] inline-block overflow-hidden pb-[0.14em] align-bottom" aria-hidden="true">
                <motion.span
                    className="inline-block"
                    initial={{ y: '110%' }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.06 }}
                >
                    {word}&nbsp;
                </motion.span>
            </span>
        ))}
    </span>
);

// Counts up to `value` when visible; re-animates when the value changes
export const AnimatedNumber = ({ value, format = (n) => Math.round(n).toLocaleString(), className = '' }) => {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true });
    const reduce = useReducedMotion();
    const mv = useMotionValue(0);
    const spring = useSpring(mv, { stiffness: 90, damping: 22 });

    useEffect(() => {
        if (inView) mv.set(Number(value) || 0);
    }, [inView, value, mv]);

    useEffect(() => spring.on('change', (v) => {
        if (ref.current) ref.current.textContent = format(v);
    }), [spring, format]);

    return (
        <span ref={ref} className={className}>
            {reduce || !Number.isFinite(Number(value)) ? (Number.isFinite(Number(value)) ? format(Number(value)) : value) : format(0)}
        </span>
    );
};
