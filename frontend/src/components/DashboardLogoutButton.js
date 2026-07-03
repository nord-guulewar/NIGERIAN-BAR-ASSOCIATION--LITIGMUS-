import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const floatingStyle = {
  position: 'fixed',
  top: '16px',
  right: '16px',
  zIndex: 1300,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  border: 'none',
  borderRadius: '999px',
  padding: '10px 14px',
  background: 'linear-gradient(135deg, #c41e3a 0%, #9e152d 100%)',
  color: '#fff',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer'
};

const mediaStyle = `
  @media (max-width: 768px) {
    .dashboard-logout-fab {
      display: none !important;
    }
  }
`;

export default function DashboardLogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <style>{mediaStyle}</style>
      <button
        type="button"
        className="dashboard-logout-fab"
        style={floatingStyle}
        onClick={handleLogout}
        aria-label="Logout"
        title="Logout"
      >
        <LogOut size={16} />
        <span>Logout</span>
      </button>
    </>
  );
}
