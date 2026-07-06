import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
  Menu,
  X,
  Home,
  FileText,
  DollarSign,
  User,
  LogOut,
  ShieldCheck,
  Bell,
  Trash2,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import offlineService from '../services/OfflineService';
import './MobileNavigation.css';

const MobileNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState(offlineService.getStatus());
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [deletingProfile, setDeletingProfile] = useState(false);

  // Update offline status
  useEffect(() => {
    if (!user) return undefined;

    const interval = setInterval(() => {
      setOfflineStatus(offlineService.getStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    document.body.classList.toggle('drawer-open', isOpen);
    return () => document.body.classList.remove('drawer-open');
  }, [isOpen]);

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/login');
  };

  const openProfileSheet = async () => {
    setIsOpen(false);
    setProfileError('');
    setShowProfileSheet(true);
    setProfileLoading(true);

    try {
      const response = await authAPI.me();
      setProfileData(response.data?.data?.user || user);
    } catch (error) {
      setProfileData(user);
      setProfileError(error.response?.data?.message || 'Unable to load profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Delete this profile? This will deactivate the account and sign you out.')) {
      return;
    }

    setDeletingProfile(true);
    setProfileError('');

    try {
      await authAPI.deleteProfile();
      setShowProfileSheet(false);
      logout();
      navigate('/login');
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Unable to delete profile.');
    } finally {
      setDeletingProfile(false);
    }
  };

  if (!user) {
    return null;
  }

  const dashboardRoutes = {
    judge: '/judge-dashboard',
    registrar: '/registrar-dashboard',
    secretary: '/secretary-dashboard',
    clerk: '/clerk-dashboard',
    cashier: '/cashier-dashboard',
    accountant: '/accountant-dashboard',
    bailiff: '/bailiff-dashboard',
    admin: '/admin-dashboard',
    record_officer: '/records-dashboard',
    court_reporter: '/court-reporter-dashboard',
    usher: '/usher-dashboard',
    security: '/security-dashboard',
    librarian: '/librarian-dashboard',
    litigation: '/litigation-dashboard',
    prosecutor: '/prosecutor-dashboard',
    probate: '/probate-dashboard'
  };

  const primaryDashboardPath = dashboardRoutes[user.role] || '/dashboard';
  const hasRoleSpecificDashboard = primaryDashboardPath !== '/dashboard';

  // Don't show on desktop
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  // Navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];

    if (hasRoleSpecificDashboard) {
      return [
        { label: 'Dashboard', meta: 'Overview', icon: Home, path: primaryDashboardPath },
        { label: 'Profile', meta: 'Account details', icon: User, action: 'profile' }
      ];
    }

    return [
      { label: 'Dashboard', meta: 'Overview', icon: Home, path: '/dashboard' },
      { label: 'Cases', meta: 'Track filings', icon: FileText, path: '/dashboard/cases' },
      { label: 'Payments', meta: 'Fees and receipts', icon: DollarSign, path: '/dashboard/payments' },
      { label: 'Reports', meta: 'Analytics', icon: Bell, path: '/dashboard/reports' },
      { label: 'Profile', meta: 'Account details', icon: User, action: 'profile' }
    ];
  };

  const navItems = getNavItems();
  const isActive = (path) => location.pathname === path;

  const handleNavItemClick = (item) => {
    if (item.action === 'profile') {
      void openProfileSheet();
      return;
    }

    handleNavigation(item.path);
  };

  const profile = profileData || user;
  const createdAtLabel = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Not available';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="mobile-nav-top-bar">
        {/* Offline Status */}
        <div className="offline-status-bar">
          {!offlineStatus.isOnline && (
            <div className="offline-indicator">
              <WifiOff size={16} />
              <span>Offline Mode</span>
              {offlineStatus.queueLength > 0 && (
                <span className="queue-badge">{offlineStatus.queueLength}</span>
              )}
            </div>
          )}
          {offlineStatus.isOnline && offlineStatus.queueLength > 0 && (
            <div className="sync-indicator">
              <RefreshCw size={16} className="rotating" />
              <span>Syncing {offlineStatus.queueLength} changes...</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-logo-block">
            <div className="mobile-nav-logo-badge">
              <ShieldCheck size={16} />
            </div>
            <div className="mobile-nav-logo-copy">
              <span className="mobile-nav-logo">NBA LITIGMUS</span>
              <span className="mobile-nav-subtitle">Court operations hub</span>
            </div>
          </div>
          <button
            className="menu-toggle"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu (Drawer) */}
      {isOpen && (
        <>
          <button className="mobile-nav-overlay" aria-label="Close navigation" onClick={() => setIsOpen(false)} />
          <div className="mobile-nav-drawer">
          {/* User Info */}
          <div className="mobile-nav-user-info">
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <p className="user-name">{user?.firstName} {user?.lastName}</p>
              <p className="user-role">{user?.role}</p>
            </div>
            <div className={`mobile-status-pill ${offlineStatus.isOnline ? 'online' : 'offline'}`}>
              {offlineStatus.isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{offlineStatus.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="mobile-nav-items">
            <div className="mobile-nav-section-label">Workspace</div>
            {navItems.map((item) => (
              <button
                key={item.path || item.action}
                onClick={() => handleNavItemClick(item)}
                className={`mobile-nav-item ${item.path && isActive(item.path) ? 'active' : ''}`}
              >
                <div className="mobile-nav-item-icon"><item.icon size={18} /></div>
                <div className="mobile-nav-item-copy">
                  <span>{item.label}</span>
                  <small>{item.meta}</small>
                </div>
              </button>
            ))}
          </nav>

          <div className="mobile-nav-divider"></div>

          <button className="mobile-nav-logout" onClick={handleLogout}>
            <div className="mobile-nav-item-icon logout-icon"><LogOut size={18} /></div>
            <div className="mobile-nav-item-copy">
              <span>Sign Out</span>
              <small>End this secure session</small>
            </div>
          </button>

          {/* Offline Status Footer */}
          <div className="mobile-nav-footer">
            {offlineStatus.isOnline ? (
              <div className="status-online">
                <Wifi size={14} />
                <span>Online</span>
              </div>
            ) : (
              <div className="status-offline">
                <WifiOff size={14} />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
          </div>
        </>
      )}

      {showProfileSheet && (
        <>
          <button className="mobile-profile-overlay" aria-label="Close profile" onClick={() => setShowProfileSheet(false)} />
          <div className="mobile-profile-sheet">
            <div className="mobile-profile-sheet-header">
              <div>
                <h3>Profile</h3>
                <p>Account details and controls</p>
              </div>
              <button type="button" className="menu-toggle" onClick={() => setShowProfileSheet(false)} aria-label="Close profile">
                <X size={22} />
              </button>
            </div>

            {profileLoading ? (
              <div className="mobile-profile-loading">Loading profile...</div>
            ) : (
              <div className="mobile-profile-content">
                <div className="mobile-profile-identity">
                  <div className="user-avatar">
                    {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                  </div>
                  <div>
                    <p className="user-name">{profile?.firstName} {profile?.lastName}</p>
                    <p className="user-role">{profile?.email}</p>
                  </div>
                </div>

                {profileError && <div className="mobile-profile-error">{profileError}</div>}

                <div className="mobile-profile-grid">
                  <div><span>Role</span><strong>{profile?.role || 'Not available'}</strong></div>
                  <div><span>Account Type</span><strong>{profile?.accountType || 'Not available'}</strong></div>
                  <div><span>Status</span><strong>{profile?.accountStatus || 'Not available'}</strong></div>
                  <div><span>Created</span><strong>{createdAtLabel}</strong></div>
                </div>

                <div className="mobile-profile-grid secondary">
                  <div><span>Phone</span><strong>{profile?.phoneNumber || 'Not available'}</strong></div>
                  <div><span>Staff ID</span><strong>{profile?.staffId || profile?.pendingStaffId || 'Not available'}</strong></div>
                  <div><span>State</span><strong>{profile?.state || 'Not available'}</strong></div>
                  <div><span>Court</span><strong>{profile?.court || 'Not available'}</strong></div>
                </div>
                <button type="button" className="mobile-profile-delete" onClick={handleDeleteProfile} disabled={deletingProfile}>
                  <Trash2 size={18} />
                  <span>{deletingProfile ? 'Deleting profile...' : 'Delete profile'}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Bottom Navigation Bar */}
      <div className="mobile-nav-bottom">
        <button
          onClick={() => handleNavigation(primaryDashboardPath)}
          className={`nav-icon ${isActive(primaryDashboardPath) ? 'active' : ''}`}
          title="Dashboard"
        >
          <Home size={24} />
          <span>Home</span>
        </button>
        {!hasRoleSpecificDashboard && (
          <>
            <button
              onClick={() => handleNavigation('/dashboard/cases')}
              className={`nav-icon ${isActive('/dashboard/cases') ? 'active' : ''}`}
              title="Cases"
            >
              <FileText size={24} />
              <span>Cases</span>
            </button>
            <button
              onClick={() => handleNavigation('/dashboard/payments')}
              className={`nav-icon ${isActive('/dashboard/payments') ? 'active' : ''}`}
              title="Payments"
            >
              <DollarSign size={24} />
              <span>Pay</span>
            </button>
            <button
              onClick={() => handleNavigation('/dashboard/reports')}
              className={`nav-icon ${isActive('/dashboard/reports') ? 'active' : ''}`}
              title="Reports"
            >
              <Bell size={24} />
              <span>Reports</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default MobileNavigation;
