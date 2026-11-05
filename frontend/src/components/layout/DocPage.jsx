import React, { useEffect, useState } from 'react';
import { Container, PageHeader, cx } from '../ui';
import { PageTransition, Reveal } from '../ui/motion';

// Long-form page with a sticky, scroll-aware table of contents
const DocPage = ({ eyebrow, title, accent, description, sections, updated }) => {
    const [active, setActive] = useState(sections[0]?.id);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach(e => e.isIntersecting && setActive(e.target.id)),
            { rootMargin: '-30% 0px -60% 0px' }
        );
        sections.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [sections]);

    return (
        <PageTransition>
            <Container>
                <PageHeader eyebrow={eyebrow} title={title} accent={accent} description={description} />
                <div className="grid gap-12 border-t border-line pt-10 lg:grid-cols-[220px_1fr]">
                    <nav className="hidden lg:block" aria-label="On this page">
                        <ul className="sticky top-28 space-y-1 border-l border-line">
                            {sections.map(s => (
                                <li key={s.id}>
                                    <a
                                        href={`#${s.id}`}
                                        className={cx(
                                            '-ml-px block border-l-2 py-1.5 pl-4 text-sm transition-colors',
                                            active === s.id ? 'border-ink font-medium text-ink' : 'border-transparent text-ink-muted hover:text-ink'
                                        )}
                                    >
                                        {s.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <article className="max-w-2xl">
                        {sections.map((s, i) => (
                            <Reveal key={s.id} as="section" className="scroll-mt-28 pb-12" delay={i === 0 ? 0.1 : 0}>
                                <h2 id={s.id} className="scroll-mt-28 text-2xl font-semibold tracking-tight">{s.title}</h2>
                                <div className="mt-4 space-y-4 leading-relaxed text-ink-soft [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                                    {s.body}
                                </div>
                            </Reveal>
                        ))}
                        {updated && <p className="border-t border-line pt-6 text-[13px] text-ink-faint">Last updated {updated}</p>}
                    </article>
                </div>
            </Container>
        </PageTransition>
    );
};

export default DocPage;
