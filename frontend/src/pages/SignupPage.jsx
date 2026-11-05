import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import AuthShell from '../components/layout/AuthShell';
import { Button, Field, Input, cx } from '../components/ui';

const RULES = [
    { test: (p) => p.length >= 8, label: '8+ characters' },
    { test: (p) => /[A-Za-z]/.test(p), label: 'A letter' },
    { test: (p) => /[0-9]/.test(p), label: 'A number' }
];

const SignupPage = () => {
    const navigate = useNavigate();
    const { register, isLoading } = useAuthStore();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const passed = RULES.map(r => r.test(form.password));
    const strong = passed.every(Boolean);
    const matches = form.confirmPassword && form.password === form.confirmPassword;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!strong) return setError('Password must be at least 8 characters and include a letter and a number.');
        if (!matches) return setError('Passwords do not match.');

        const result = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        if (result.success) {
            toast.success('Welcome to Incident Tracker');
            navigate('/dashboard');
        } else {
            setError(result.error || 'Registration failed');
        }
    };

    const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

    return (
        <AuthShell
            eyebrow="Join the network"
            title="Create your"
            accent="account."
            subtitle="Report incidents, confirm what you see nearby and earn reputation."
            quote="“Every confirmation helps a responder decide where to go first.”"
            footer={<>Already have an account? <Link to="/login" className="link-underline font-medium text-ink">Log in</Link></>}
        >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Field label="Full name" htmlFor="name">
                    <Input id="name" autoComplete="name" placeholder="Jane Doe" value={form.name} onChange={set('name')} maxLength={50} required autoFocus />
                </Field>
                <Field label="Email" htmlFor="email">
                    <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
                </Field>
                <Field label="Password" htmlFor="password">
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            placeholder="Create a password"
                            value={form.password}
                            onChange={set('password')}
                            className="pr-11"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                        {RULES.map((rule, i) => (
                            <li key={rule.label} className={cx('flex items-center gap-1.5 text-[13px] transition-colors', passed[i] ? 'text-sev-low' : 'text-ink-faint')}>
                                <motion.span animate={{ scale: passed[i] ? 1 : 0.6, opacity: passed[i] ? 1 : 0.4 }}>
                                    <Check className="h-3.5 w-3.5" />
                                </motion.span>
                                {rule.label}
                            </li>
                        ))}
                    </ul>
                </Field>
                <Field
                    label="Confirm password"
                    htmlFor="confirm"
                    error={form.confirmPassword && !matches ? 'Passwords do not match' : undefined}
                >
                    <Input id="confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Repeat password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                </Field>

                {error && <p className="text-sm text-sev-critical" role="alert">{error}</p>}

                <Button type="submit" size="lg" loading={isLoading} className="w-full" disabled={!form.name || !form.email || !strong || !matches}>
                    Create account {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
                <p className="text-[13px] text-ink-muted">
                    New accounts are citizen accounts. Responder access is granted by an administrator.
                </p>
            </form>
        </AuthShell>
    );
};

export default SignupPage;
