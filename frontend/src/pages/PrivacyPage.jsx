import React from 'react';
import DocPage from '../components/layout/DocPage';

const SECTIONS = [
    {
        id: 'collect',
        title: 'What we collect',
        body: (
            <>
                <p>We only collect what the service needs to work:</p>
                <ul>
                    <li><strong>Account details:</strong> your name, email, optional phone number, and a securely hashed password (we never store the password itself).</li>
                    <li><strong>Reports:</strong> the incident type, title, description, severity, location and any photos or videos you attach.</li>
                    <li><strong>Activity:</strong> confirmations and comments you post, used for reputation and to show who confirmed what.</li>
                    <li><strong>Technical data:</strong> your IP address, briefly, to protect the service against abuse (rate limiting).</li>
                </ul>
            </>
        )
    },
    {
        id: 'visible',
        title: 'What others can see',
        body: (
            <>
                <p>Incidents are public so the community can see and confirm them. Anyone can see an incident's title, description, location, photos, status and the reporter's display name.</p>
                <p>Your <strong>contact details</strong> (email or phone) on a report are only visible to you and to responders. Internal responder notes are never shown publicly.</p>
                <p>You can report anonymously without an account; in that case only the name you choose is shown.</p>
            </>
        )
    },
    {
        id: 'use',
        title: 'How we use it',
        body: (
            <ul>
                <li>To show incidents on the feed and map, and to route them to responders.</li>
                <li>To detect duplicate reports and calculate response priority.</li>
                <li>To send in-app and browser notifications you've allowed.</li>
                <li>We do not sell your data or use it for advertising.</li>
            </ul>
        )
    },
    {
        id: 'storage',
        title: 'Storage and security',
        body: (
            <>
                <p>Data is stored in a managed PostgreSQL database and file storage (Supabase), accessed only by our server. All traffic is encrypted with HTTPS.</p>
                <p>Passwords are hashed with bcrypt, sessions expire after 7 days and are revoked when you change your password, and sign-in attempts are rate limited.</p>
            </>
        )
    },
    {
        id: 'rights',
        title: 'Your choices',
        body: (
            <ul>
                <li>Update your name, phone and password at any time from your profile.</li>
                <li>Ask us to delete your account or a report you made via the contact page.</li>
                <li>Location access and notifications are always optional and controlled by your browser.</li>
            </ul>
        )
    }
];

const PrivacyPage = () => (
    <DocPage
        eyebrow="Legal"
        title="Privacy"
        accent="policy."
        description="Plain-language summary of what we collect, who can see it and how it's protected."
        sections={SECTIONS}
        updated="November 2026"
    />
);

export default PrivacyPage;
