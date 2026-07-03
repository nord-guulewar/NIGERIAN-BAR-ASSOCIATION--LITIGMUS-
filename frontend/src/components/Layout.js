import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar, Nav, Container, Row, Col } from 'react-bootstrap';
import { Building2, CreditCard, FileText, LogOut, Menu, Scale, ShieldCheck, UserCircle2, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PolicyLinks from './PolicyLinks';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canViewPayments = ['admin', 'accountant', 'cashier', 'registrar'].includes(user?.role);
  const [showMobileSidebar, setShowMobileSidebar] = React.useState(false);
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="d-flex flex-column min-vh-100 layout-wrapper">
      <Navbar expand="lg" className="no-print navbar-compact">
        <Container fluid className="px-2 px-md-3">
          <div className="d-flex align-items-center">
            <button 
              className="btn btn-link text-light me-2 d-lg-none p-1"
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              aria-label="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <Navbar.Brand as={Link} to="/" className="py-1 d-flex align-items-center">
              <span className="nav-brand-mark">
                <Scale size={22} />
              </span>
              <span className="nav-brand-copy">
                <span className="nav-brand-name d-none d-sm-inline">NBA LITIGMUS</span>
                <span className="nav-brand-name d-inline d-sm-none">NBA</span>
                <span className="nav-brand-subtitle d-none d-md-inline">Court operations platform</span>
              </span>
            </Navbar.Brand>
          </div>
          
          <div className="d-flex align-items-center">
            <div className="topbar-user d-none d-md-inline-flex me-2">
              <span className="topbar-user-avatar">{userInitials || 'U'}</span>
              <span className="topbar-user-copy">
                <span className="topbar-user-name">{user?.firstName}</span>
                <span className="role-pill">{user?.role}</span>
              </span>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn btn-outline-light btn-sm py-1 px-2"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="d-none d-md-inline ms-1">Logout</span>
            </button>
          </div>
        </Container>
      </Navbar>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="mobile-sidebar-overlay d-lg-none"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      <Container fluid className="flex-grow-1 p-0">
        <Row className="g-0 h-100">
          {/* Desktop Sidebar */}
          <Col lg={2} className="sidebar text-light d-none d-lg-block">
            <Nav className="flex-column sidebar-nav">
              <Nav.Link
                as={Link}
                to="/"
                className={isActive('/') && !isActive('/cases') && !isActive('/judges') && !isActive('/payments') && !isActive('/reports') ? 'active' : ''}
              >
                <Building2 size={18} />
                <span>Dashboard</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/cases"
                className={isActive('/cases') ? 'active' : ''}
              >
                <FileText size={18} />
                <span>Cases</span>
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/judges"
                className={isActive('/judges') ? 'active' : ''}
              >
                <UserCircle2 size={18} />
                <span>Judges</span>
              </Nav.Link>
              {canViewPayments && (
                <Nav.Link
                  as={Link}
                  to="/payments"
                  className={isActive('/payments') ? 'active' : ''}
                >
                  <CreditCard size={18} />
                  <span>Payments</span>
                </Nav.Link>
              )}
              <Nav.Link
                as={Link}
                to="/reports"
                className={isActive('/reports') ? 'active' : ''}
              >
                <ShieldCheck size={18} />
                <span>Reports</span>
              </Nav.Link>
            </Nav>
          </Col>

          {/* Mobile Sidebar Drawer */}
          <div className={`mobile-sidebar d-lg-none ${showMobileSidebar ? 'show' : ''}`}>
            <div className="mobile-sidebar-header">
              <span className="text-light fw-bold">Menu</span>
              <button 
                className="btn btn-link text-light"
                onClick={() => setShowMobileSidebar(false)}
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <Nav className="flex-column">
              <Nav.Link
                as={Link}
                to="/"
                onClick={() => setShowMobileSidebar(false)}
                className={isActive('/') && !isActive('/cases') && !isActive('/judges') && !isActive('/payments') && !isActive('/reports') ? 'active' : ''}
              >
                <Building2 size={18} />
                Dashboard
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/cases"
                onClick={() => setShowMobileSidebar(false)}
                className={isActive('/cases') ? 'active' : ''}
              >
                <FileText size={18} />
                Cases
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/judges"
                onClick={() => setShowMobileSidebar(false)}
                className={isActive('/judges') ? 'active' : ''}
              >
                <UserCircle2 size={18} />
                Judges
              </Nav.Link>
              {canViewPayments && (
                <Nav.Link
                  as={Link}
                  to="/payments"
                  onClick={() => setShowMobileSidebar(false)}
                  className={isActive('/payments') ? 'active' : ''}
                >
                  <CreditCard size={18} />
                  Payments
                </Nav.Link>
              )}
              <Nav.Link
                as={Link}
                to="/reports"
                onClick={() => setShowMobileSidebar(false)}
                className={isActive('/reports') ? 'active' : ''}
              >
                <ShieldCheck size={18} />
                Reports
              </Nav.Link>
            </Nav>
          </div>

          {/* Main Content */}
          <Col lg={10} className="main-content">
            <Outlet />
            
            {/* Footer */}
            <footer className="app-footer mt-auto py-3 border-top">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="text-muted small">
                  © 2026 Nigerian Bar Association. All rights reserved.
                </span>
                <div className="d-flex flex-column align-items-md-end gap-2">
                  <PolicyLinks compact />
                  <span className="text-muted small">NBA LITIGMUS v1.0</span>
                </div>
              </div>
            </footer>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Layout;
