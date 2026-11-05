import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../stores/authStore';
import AuthShell from '../components/layout/AuthShell';
import { Button, Field, Input } from '../components/ui';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, isLoading } = useAuthStore();
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await login(form);
        if (result.success) {
            toast.success(`Welcome back, ${result.user.name}`);
            const staff = ['admin', 'responder'].includes(result.user.role);
            navigate(location.state?.from || (staff ? '/admin' : '/dashboard'), { replace: true });
        } else {
            setError(result.error || 'Login failed');
        }
    };

    return (
        <AuthShell
            eyebrow="Welcome back"
            title="Log in to"
            accent="your account."
            subtitle="Confirm reports, follow your incidents and join the conversation."
            quote="“The fastest response starts with the first person who speaks up.”"
            footer={<>New here? <Link to="/signup" className="link-underline font-medium text-ink">Create an account</Link></>}
        >
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <Field label="Email" htmlFor="email">
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                        autoFocus
                    />
                </Field>
                <Field label="Password" htmlFor="password">
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            placeholder="Your password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                </Field>

                {error && <p className="text-sm text-sev-critical" role="alert">{error}</p>}

                <Button type="submit" size="lg" loading={isLoading} className="w-full" disabled={!form.email || !form.password}>
                    Log in {!isLoading && <ArrowRight className="h-4 w-4" />}
                </Button>
            </form>
        </AuthShell>
    );
};

export default LoginPage;
