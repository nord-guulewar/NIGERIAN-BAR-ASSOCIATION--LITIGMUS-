import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/ThemeContext';
import { RoleProtectedRoute, PublicRoute, PrivateRoute } from './components/ProtectedRoute';
import './pages/PublicPages.css';
import './styles/beautification.css';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const JudgeDashboard = lazy(() => import('./pages/JudgeDashboard'));
const RegistrarDashboard = lazy(() => import('./pages/RegistrarDashboard'));
const SecretaryDashboard = lazy(() => import('./pages/SecretaryDashboard'));
const AccountantDashboard = lazy(() => import('./pages/AccountantDashboard'));
const CashierDashboard = lazy(() => import('./pages/CashierDashboard'));
const ProsecutorDashboard = lazy(() => import('./pages/ProsecutorDashboard'));
const ClerkDashboard = lazy(() => import('./pages/ClerkDashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const CaseDetails = lazy(() => import('./pages/CaseDetails'));
const NewCase = lazy(() => import('./pages/NewCase'));
const Judges = lazy(() => import('./pages/Judges'));
const JudgeDetails = lazy(() => import('./pages/JudgeDetails'));
const Payments = lazy(() => import('./pages/Payments'));
const Reports = lazy(() => import('./pages/Reports'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const LegalCompliance = lazy(() => import('./pages/LegalCompliance'));
const PolicyDocumentPage = lazy(() => import('./pages/PolicyDocumentPage'));
const JudgeOnboarding = lazy(() => import('./pages/JudgeOnboarding'));
const ConfirmAccount = lazy(() => import('./pages/ConfirmAccount'));
const JudgeRegister = lazy(() => import('./pages/JudgeRegister'));
const JudgeLogin = lazy(() => import('./pages/JudgeLogin'));
const FindLawyer = lazy(() => import('./pages/FindLawyer'));
const Services = lazy(() => import('./pages/Services'));
const CourtUpdates = lazy(() => import('./pages/CourtUpdates'));
const Contacts = lazy(() => import('./pages/Contacts'));
const Layout = lazy(() => import('./components/Layout'));
const MobileNavigation = lazy(() => import('./components/MobileNavigation'));
const IssueReporter = lazy(() => import('./components/IssueReporter'));
const CredentialManager = lazy(() => import('./components/CredentialManager'));
const OfflineSync = lazy(() => import('./services/OfflineSync'));
const BailiffDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.BailiffDashboard }))
);
const RecordsDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.RecordsDashboard }))
);
const AdministratorDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.AdministratorDashboard }))
);
const LibrarianDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.LibrarianDashboard }))
);
const LitigationDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.LitigationDashboard }))
);
const ProbateDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.ProbateDashboard }))
);
const CourtReporterDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.CourtReporterDashboard }))
);
const UsherDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.UsherDashboard }))
);
const SecurityDashboard = lazy(() =>
  import('./pages/RoleDashboard').then((module) => ({ default: module.SecurityDashboard }))
);

function AppLoader() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`app-preloader ${isDarkMode ? 'dark' : 'light'}`} role="status" aria-live="polite" aria-label="Loading application">
      <div className="app-preloader-shell">
        <div className="app-preloader-mark">
          <span className="app-preloader-ring" />
          <span className="app-preloader-core">NBA</span>
        </div>
        <div className="app-preloader-copy">
          <strong>Loading NBA LITIGMUS</strong>
          <span>Preparing your secure workspace</span>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {user && (
        <Suspense fallback={null}>
          <OfflineSync />
        </Suspense>
      )}
      {user && (
        <Suspense fallback={null}>
          <MobileNavigation />
        </Suspense>
      )}
      {user && (
        <Suspense fallback={null}>
          <IssueReporter />
        </Suspense>
      )}
      {user && (
        <Suspense fallback={null}>
          <CredentialManager />
        </Suspense>
      )}
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/admin-login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal-compliance" element={<LegalCompliance />} />
        <Route path="/policies/:policyKey" element={<PolicyDocumentPage />} />
        <Route path="/judge-onboarding" element={<JudgeOnboarding />} />
        <Route path="/judge-register" element={<JudgeRegister />} />
        <Route path="/judge-login" element={<JudgeLogin />} />
        <Route path="/confirm-account" element={<ConfirmAccount />} />
        <Route path="/find-lawyer" element={<FindLawyer />} />
        <Route path="/services" element={<Services />} />
        <Route path="/court-updates" element={<CourtUpdates />} />
        <Route path="/contacts" element={<Contacts />} />

        <Route path="/admin-dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdminDashboard /></RoleProtectedRoute>} />
        <Route path="/judge-dashboard" element={<RoleProtectedRoute allowedRoles={['judge']}><JudgeDashboard /></RoleProtectedRoute>} />
        <Route path="/registrar-dashboard" element={<RoleProtectedRoute allowedRoles={['registrar']}><RegistrarDashboard /></RoleProtectedRoute>} />
        <Route path="/secretary-dashboard" element={<RoleProtectedRoute allowedRoles={['secretary']}><SecretaryDashboard /></RoleProtectedRoute>} />
        <Route path="/accountant-dashboard" element={<RoleProtectedRoute allowedRoles={['accountant']}><AccountantDashboard /></RoleProtectedRoute>} />
        <Route path="/cashier-dashboard" element={<RoleProtectedRoute allowedRoles={['cashier']}><CashierDashboard /></RoleProtectedRoute>} />
        <Route path="/prosecutor-dashboard" element={<RoleProtectedRoute allowedRoles={['prosecutor']}><ProsecutorDashboard /></RoleProtectedRoute>} />
        <Route path="/clerk-dashboard" element={<RoleProtectedRoute allowedRoles={['clerk']}><ClerkDashboard /></RoleProtectedRoute>} />
        <Route path="/bailiff-dashboard" element={<RoleProtectedRoute allowedRoles={['bailiff']}><BailiffDashboard /></RoleProtectedRoute>} />
        <Route path="/records-dashboard" element={<RoleProtectedRoute allowedRoles={['record_officer']}><RecordsDashboard /></RoleProtectedRoute>} />
        <Route path="/administrator-dashboard" element={<RoleProtectedRoute allowedRoles={['admin']}><AdministratorDashboard /></RoleProtectedRoute>} />
        <Route path="/librarian-dashboard" element={<RoleProtectedRoute allowedRoles={['librarian']}><LibrarianDashboard /></RoleProtectedRoute>} />
        <Route path="/litigation-dashboard" element={<RoleProtectedRoute allowedRoles={['litigation']}><LitigationDashboard /></RoleProtectedRoute>} />
        <Route path="/probate-dashboard" element={<RoleProtectedRoute allowedRoles={['probate']}><ProbateDashboard /></RoleProtectedRoute>} />
        <Route path="/court-reporter-dashboard" element={<RoleProtectedRoute allowedRoles={['court_reporter']}><CourtReporterDashboard /></RoleProtectedRoute>} />
        <Route path="/usher-dashboard" element={<RoleProtectedRoute allowedRoles={['usher']}><UsherDashboard /></RoleProtectedRoute>} />
        <Route path="/security-dashboard" element={<RoleProtectedRoute allowedRoles={['security']}><SecurityDashboard /></RoleProtectedRoute>} />
        
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="cases" element={<Cases />} />
          <Route path="cases/new" element={<NewCase />} />
          <Route path="cases/:id" element={<CaseDetails />} />
          <Route path="judges" element={<Judges />} />
          <Route path="judges/:id" element={<JudgeDetails />} />
          <Route path="payments" element={<Payments />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
      
      {!isOnline && (
        <div className="offline-indicator">
          <div className="alert alert-warning mb-0" role="alert">
            <i className="bi bi-wifi-off me-2"></i>
            You are offline. Changes will sync when online.
          </div>
        </div>
      )}
      
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Suspense fallback={<AppLoader />}>
            <AppRoutes />
          </Suspense>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
