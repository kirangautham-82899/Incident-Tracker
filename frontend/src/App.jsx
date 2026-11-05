import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import Loading from './components/common/Loading';

// Heavier pages (maps, charts) are loaded on demand
const ReportPage = lazy(() => import('./pages/ReportPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const IncidentDetailPage = lazy(() => import('./pages/IncidentDetailPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
import useAuthStore from './stores/authStore';
import useIncidentStore from './stores/incidentStore';
import socketService from './utils/socket';
import notificationService from './utils/notificationService';
import { isStaff, STATUS_LABELS } from './utils/constants';
import { sameId } from './utils/helpers';

// Requires a logged-in user; optionally restricted to roles
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

// Keeps the incident store and notifications in sync with the server
const useRealtime = () => {
  const token = useAuthStore((s) => s.token);
  const refreshUser = useAuthStore((s) => s.refreshUser);

  useEffect(() => {
    socketService.connect(token);
  }, [token]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const { addIncident, updateIncident, removeIncident } = useIncidentStore.getState();
    const me = () => useAuthStore.getState().user;

    const offCreated = socketService.on('incident_created', (incident) => {
      addIncident(incident);
      if (sameId(incident.reporter?.userId, me())) return; // own report: the form already confirmed it
      const urgent = ['critical', 'high'].includes(incident.severity);
      toast(`New ${incident.severity} ${incident.type} incident: ${incident.title}`, {
        icon: urgent ? '🚨' : '📍'
      });
      if (urgent || isStaff(me())) notificationService.notifyNewIncident(incident);
    });

    const offUpdated = socketService.on('incident_updated', (incident) => {
      const previous = useIncidentStore.getState().incidents.find(i => i._id === incident._id);
      updateIncident(incident);
      // Tell the reporter when their incident's status changes
      if (previous && previous.status !== incident.status && sameId(incident.reporter?.userId, me())) {
        toast(`Your report "${incident.title}" is now ${STATUS_LABELS[incident.status]}`, { icon: '🔄' });
        notificationService.notifyStatusUpdate(incident, incident.status);
      }
    });

    const offVerified = socketService.on('incident_verified', (incident) => {
      updateIncident(incident);
      if (sameId(incident.reporter?.userId, me())) {
        notificationService.notifyVerification(incident);
      }
    });

    const offDeleted = socketService.on('incident_deleted', ({ _id }) => removeIncident(_id));

    // Fallback when the live connection is unavailable (e.g. serverless API host):
    // poll the current list so the feed, map and console still update.
    const poll = setInterval(() => {
      if (!socketService.connected && document.visibilityState === 'visible') {
        useIncidentStore.getState().refresh();
        socketService.dispatchLocal('data_refresh'); // stats/analytics panels reload too
      }
    }, 20000);

    return () => {
      offCreated();
      offUpdated();
      offVerified();
      offDeleted();
      clearInterval(poll);
    };
  }, []);
};

function App() {
  useRealtime();

  return (
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
          }}
        />

        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loading text="Loading..." /></div>}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Logged-in users */}
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Responders and admins */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'responder']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
  );
}

export default App;
