import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Spinner } from './components/ui';

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

// Shared chrome (navbar, footer). Keying the outlet by path replays each page's enter animation.
const AppLayout = ({ bare = false }) => {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
        <div key={location.pathname} className="flex-1">
          <Suspense fallback={<Spinner className="min-h-[60vh]" />}>
            <Outlet />
          </Suspense>
        </div>
      {!bare && <Footer />}
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
};

function App() {
  useRealtime();

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="bottom-center"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#16161A',
            color: '#FAF9F6',
            borderRadius: '999px',
            padding: '10px 18px',
            fontSize: '14px',
            boxShadow: '0 20px 40px -20px rgba(22,22,26,0.5)'
          },
          success: { iconTheme: { primary: '#2F9E6E', secondary: '#FAF9F6' } },
          error: { iconTheme: { primary: '#E5402A', secondary: '#FAF9F6' } }
        }}
      />

      <Routes>
        {/* Auth pages: full-bleed, no footer */}
        <Route element={<AppLayout bare />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Full-height tools: no footer */}
        <Route element={<AppLayout bare />}>
          <Route path="/map" element={<MapPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin', 'responder']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/incident/:id" element={<IncidentDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
