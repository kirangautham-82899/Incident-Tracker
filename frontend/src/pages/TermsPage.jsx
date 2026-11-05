import React from 'react';
import DocPage from '../components/layout/DocPage';

const SECTIONS = [
    {
        id: 'emergency',
        title: 'Not an emergency service',
        body: (
            <>
                <p><strong>Incident Tracker does not replace emergency services.</strong> If someone's life or safety is at risk, call your local emergency number (112 / 911) first, then report here.</p>
                <p>Responders on this platform act on a best-effort basis and response times are not guaranteed.</p>
            </>
        )
    },
    {
        id: 'responsibilities',
        title: 'Your responsibilities',
        body: (
            <ul>
                <li>Report only real incidents, as accurately as you can.</li>
                <li>Don't post false reports, spam, or content that exposes private people's personal information.</li>
                <li>Only upload photos and videos you have the right to share, and avoid graphic content where possible.</li>
                <li>Keep your account credentials private.</li>
            </ul>
        )
    },
    {
        id: 'moderation',
        title: 'Moderation',
        body: (
            <>
                <p>Responders and administrators can change an incident's status, mark it as a false report, or remove it. Reports marked false reduce the reporter's reputation.</p>
                <p>Accounts that abuse the service may be deactivated.</p>
            </>
        )
    },
    {
        id: 'content',
        title: 'Your content',
        body: (
            <p>You keep ownership of what you post. By posting, you allow Incident Tracker to display it to the public and to responders for the purpose of handling the incident.</p>
        )
    },
    {
        id: 'changes',
        title: 'Changes',
        body: (
            <p>We may update these terms as the service evolves. Continuing to use the service after an update means you accept the new terms.</p>
        )
    }
];

const TermsPage = () => (
    <DocPage
        eyebrow="Legal"
        title="Terms of"
        accent="service."
        description="The ground rules for reporting and responding on Incident Tracker."
        sections={SECTIONS}
        updated="November 2026"
    />
);

export default TermsPage;
