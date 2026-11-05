import React from 'react';
import AnalyticsPanel from '../components/analytics/AnalyticsPanel';
import { Container, PageHeader } from '../components/ui';
import { PageTransition } from '../components/ui/motion';

const AnalyticsPage = () => (
    <PageTransition>
        <Container>
            <PageHeader
                eyebrow="Analytics"
                title="How the community"
                accent="is responding."
                description="Incident volume, severity and response times, updated automatically as reports come in."
            />
            <AnalyticsPanel />
        </Container>
    </PageTransition>
);

export default AnalyticsPage;
