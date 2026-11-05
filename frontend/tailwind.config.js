/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                // "Ink on paper": warm neutrals + a single signal colour
                paper: { DEFAULT: '#FAF9F6', deep: '#F3F1EC' },
                ink: { DEFAULT: '#16161A', soft: '#3A3A42', muted: '#6E6D76', faint: '#9C9BA3' },
                line: { DEFAULT: '#E6E3DC', strong: '#D3CFC6' },
                signal: { DEFAULT: '#E5402A', deep: '#C4301C', soft: '#FDEBE7' },
                sev: { low: '#2F9E6E', medium: '#C98A12', high: '#E06B1F', critical: '#D7262E' },
                state: { reported: '#B7791F', verified: '#2563EB', progress: '#7C3AED', resolved: '#2F9E6E', false: '#8A8A93' }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
                serif: ['"Instrument Serif"', 'Georgia', 'serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
            },
            letterSpacing: { tightest: '-0.045em' },
            maxWidth: { page: '76rem' },
            transitionTimingFunction: { out: 'cubic-bezier(0.22, 1, 0.36, 1)' },
            keyframes: {
                pulseDot: {
                    '0%': { transform: 'scale(1)', opacity: '0.7' },
                    '100%': { transform: 'scale(2.6)', opacity: '0' }
                },
                marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } }
            },
            animation: {
                'pulse-dot': 'pulseDot 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
                marquee: 'marquee 40s linear infinite'
            }
        }
    },
    plugins: []
};
