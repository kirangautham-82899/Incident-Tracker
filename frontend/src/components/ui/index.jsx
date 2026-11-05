import React, { useId } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { EASE } from './motion';
import {
    SEVERITY_COLORS, STATUS_COLORS, SEVERITY_LABELS, STATUS_LABELS, ROLE_COLORS, TYPE_COLORS, TYPE_LABELS
} from '../../utils/constants';

const cx = (...c) => c.filter(Boolean).join(' ');
export { cx };

/* ---------- Buttons ---------- */

const BUTTON_VARIANTS = {
    primary: 'bg-ink text-paper hover:bg-ink-soft',
    signal: 'bg-signal text-white hover:bg-signal-deep',
    outline: 'text-ink ring-1 ring-inset ring-line-strong hover:ring-ink hover:bg-white',
    ghost: 'text-ink-soft hover:text-ink hover:bg-paper-deep',
    danger: 'text-sev-critical ring-1 ring-inset ring-sev-critical/30 hover:bg-sev-critical/5'
};
const BUTTON_SIZES = {
    sm: 'h-8 px-3 text-[13px] gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-[15px] gap-2.5'
};

export const Button = React.forwardRef(({
    as, to, href, variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...props
}, ref) => {
    const classes = cx(
        'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-medium',
        'transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-40',
        BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className
    );
    const content = (
        <>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </>
    );
    if (to) return <Link ref={ref} to={to} className={classes} {...props}>{content}</Link>;
    if (href) return <a ref={ref} href={href} className={classes} {...props}>{content}</a>;
    const Comp = as || 'button';
    return (
        <Comp ref={ref} className={classes} disabled={disabled || loading} type={props.type || 'button'} {...props}>
            {content}
        </Comp>
    );
});
Button.displayName = 'Button';

export const IconButton = ({ label, className = '', children, ...props }) => (
    <button
        type="button"
        aria-label={label}
        title={label}
        className={cx('inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-paper-deep hover:text-ink', className)}
        {...props}
    >
        {children}
    </button>
);

/* ---------- Badges & dots ---------- */

export const Dot = ({ color, pulse = false, className = '' }) => (
    <span className={cx('relative inline-flex h-2 w-2 shrink-0', className)}>
        {pulse && <span className="absolute inset-0 animate-pulse-dot rounded-full" style={{ background: color }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
);

// Text badge with a coloured dot: no box, just colour + weight
export const Tag = ({ color, children, pulse, className = '' }) => (
    <span className={cx('inline-flex items-center gap-1.5 text-[13px] font-medium', className)} style={{ color }}>
        <Dot color={color} pulse={pulse} />
        <span>{children}</span>
    </span>
);

export const SeverityTag = ({ severity, className }) => (
    <Tag color={SEVERITY_COLORS[severity]} pulse={severity === 'critical'} className={className}>
        {SEVERITY_LABELS[severity] || severity}
    </Tag>
);

export const StatusTag = ({ status, className }) => (
    <Tag color={STATUS_COLORS[status]} className={className}>{STATUS_LABELS[status] || status}</Tag>
);

export const TypeTag = ({ type, className }) => (
    <Tag color={TYPE_COLORS[type]} className={className}>{TYPE_LABELS[type] || type}</Tag>
);

export const RoleTag = ({ role, className }) => (
    <span
        className={cx('rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider', className)}
        style={{ color: ROLE_COLORS[role] || ROLE_COLORS.citizen, background: `${ROLE_COLORS[role] || ROLE_COLORS.citizen}14` }}
    >
        {role === 'bot' ? 'assistant' : role}
    </span>
);

/* ---------- Page structure ---------- */

export const Container = ({ className = '', children }) => (
    <div className={cx('mx-auto w-full max-w-page px-5 sm:px-8', className)}>{children}</div>
);

export const PageHeader = ({ eyebrow, title, accent, description, actions, className = '' }) => (
    <header className={cx('pb-8 pt-10 sm:pb-10 sm:pt-14', className)}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
                {eyebrow && (
                    <motion.p
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="eyebrow mb-3"
                    >
                        {eyebrow}
                    </motion.p>
                )}
                <motion.h1
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
                    className="text-4xl font-semibold leading-[1.05] tracking-tightest sm:text-5xl"
                >
                    {title}{accent && <> <span className="font-serif font-normal italic tracking-normal text-ink-soft">{accent}</span></>}
                </motion.h1>
                {description && (
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: EASE, delay: 0.12 }}
                        className="mt-4 text-[15px] leading-relaxed text-ink-muted sm:text-base"
                    >
                        {description}
                    </motion.p>
                )}
            </div>
            {actions && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-wrap items-center gap-3 md:flex-nowrap md:shrink-0"
                >
                    {actions}
                </motion.div>
            )}
        </div>
    </header>
);

// Section separated by a hairline rule; optional side heading
export const Section = ({ title, description, aside, className = '', children, id }) => (
    <section id={id} className={cx('border-t border-line py-10', className)}>
        {(title || aside) && (
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
                <div>
                    {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
                    {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
                </div>
                {aside}
            </div>
        )}
        {children}
    </section>
);

/* ---------- Data display ---------- */

export const Stat = ({ label, value, hint, tone }) => (
    <div className="min-w-0">
        <div className="eyebrow mb-2">{label}</div>
        <div className="font-display text-4xl font-semibold tracking-tightest tabular-nums" style={tone ? { color: tone } : undefined}>
            {value}
        </div>
        {hint && <div className="mt-1 text-[13px] text-ink-muted">{hint}</div>}
    </div>
);

// Row of stats divided by vertical rules
export const StatRow = ({ children, className = '' }) => (
    <div className={cx('grid grid-cols-2 gap-x-6 gap-y-8 border-y border-line py-8 md:grid-cols-4 md:divide-x md:divide-line md:gap-0 [&>*]:md:px-8 [&>*:first-child]:md:pl-0', className)}>
        {children}
    </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="flex flex-col items-center py-20 text-center"
    >
        {Icon && <Icon className="mb-5 h-8 w-8 text-ink-faint" strokeWidth={1.5} />}
        <h3 className="text-lg font-semibold">{title}</h3>
        {children && <p className="mt-2 max-w-sm text-sm text-ink-muted">{children}</p>}
        {action && <div className="mt-6">{action}</div>}
    </motion.div>
);

export const Spinner = ({ label = 'Loading', className = '' }) => (
    <div className={cx('flex items-center justify-center gap-3 py-16 text-sm text-ink-muted', className)} role="status">
        <Loader2 className="h-4 w-4 animate-spin" />
        {label}
    </div>
);

/* ---------- Forms ---------- */

export const Field = ({ label, hint, error, children, className = '', htmlFor }) => (
    <div className={cx('space-y-2', className)}>
        {label && (
            <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink-soft">
                {label}
            </label>
        )}
        {children}
        {error ? (
            <p className="text-[13px] text-sev-critical">{error}</p>
        ) : hint ? (
            <p className="text-[13px] text-ink-muted">{hint}</p>
        ) : null}
    </div>
);

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
    <input ref={ref} className={cx('field', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef(({ className = '', ...props }, ref) => (
    <textarea ref={ref} className={cx('field min-h-[120px] resize-y leading-relaxed', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Select = ({ className = '', children, ...props }) => (
    <select className={cx('field cursor-pointer appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%236E6D76%27 stroke-width=%272%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-9', className)} {...props}>
        {children}
    </select>
);

/* ---------- Navigation-ish ---------- */

// Underline tabs with an animated indicator
export const Tabs = ({ tabs, value, onChange, className = '' }) => {
    const id = useId();
    return (
        <div className={cx('flex gap-6 overflow-x-auto overflow-y-hidden border-b border-line [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)} role="tablist">
            {tabs.map(tab => {
                const active = tab.value === value;
                return (
                    <button
                        key={tab.value}
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(tab.value)}
                        className={cx('relative shrink-0 pb-3 text-sm font-medium transition-colors', active ? 'text-ink' : 'text-ink-muted hover:text-ink')}
                    >
                        <span className="flex items-center gap-2">
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={cx('font-mono text-[11px] tabular-nums', active ? 'text-ink' : 'text-ink-faint')}>{tab.count}</span>
                            )}
                        </span>
                        {active && (
                            <motion.span layoutId={`tab-${id}`} className="absolute inset-x-0 bottom-0 h-0.5 bg-ink" transition={{ type: 'spring', stiffness: 500, damping: 40 }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

// Pill segmented control (choices like severity)
export const Segmented = ({ options, value, onChange, className = '', colorFor }) => {
    const id = useId();
    return (
        <div className={cx('inline-flex flex-wrap gap-1 rounded-full bg-paper-deep p-1', className)} role="radiogroup">
            {options.map(opt => {
                const active = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.value)}
                        className={cx('relative rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors', active ? 'text-white' : 'text-ink-muted hover:text-ink')}
                    >
                        {active && (
                            <motion.span
                                layoutId={`seg-${id}`}
                                className="absolute inset-0 rounded-full"
                                style={{ background: colorFor?.(opt.value) || '#16161A' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                            />
                        )}
                        <span className="relative">{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
