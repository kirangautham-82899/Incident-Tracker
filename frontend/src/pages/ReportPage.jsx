import React from 'react';
import { useNavigate } from 'react-router-dom';
import IncidentReportForm from '../components/incident/IncidentReportForm';
import { Container, PageHeader } from '../components/ui';
import { PageTransition } from '../components/ui/motion';

const ReportPage = () => {
    const navigate = useNavigate();

    return (
        <PageTransition>
            <Container className="max-w-5xl">
                <PageHeader
                    eyebrow="New report"
                    title="Report an"
                    accent="incident."
                    description="Tell us what happened and where. Your report appears on the live feed and map immediately, and responders are notified."
                />
                <IncidentReportForm
                    onClose={() => navigate(-1)}
                    onSubmitted={(incident) => navigate(`/incident/${incident._id}`)}
                />
            </Container>
        </PageTransition>
    );
};

export default ReportPage;
