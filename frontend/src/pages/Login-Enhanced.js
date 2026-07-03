import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login-Enhanced.css';
import { getSessionUser } from '../utils/sessionAuth';

const Login = () => {
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  const roles = [
    { id: 'judge', name: '👨‍⚖️ Judge', description: 'Judicial Officer', color: 'from-purple-600 to-purple-800' },
    { id: 'other', name: '👥 Other Roles', description: 'Clerk, Registrar, Accountant, etc.', color: 'from-blue-600 to-blue-800' },
    { id: 'admin', name: '🔐 Admin', description: 'System Administrator', color: 'from-red-600 to-red-800' }
  ];

  const handleLoginClick = () => {
    setShowRoleSelector(true);
  };

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        const userData = getSessionUser();
        const userRole = userData?.role;
        const dashboardRoutes = {
          judge: '/judge-dashboard',
          registrar: '/registrar-dashboard',
          secretary: '/secretary-dashboard',
          clerk: '/clerk-dashboard',
          cashier: '/cashier-dashboard',
          accountant: '/accountant-dashboard',
          bailiff: '/bailiff-dashboard',
          admin: '/admin-dashboard'
        };
        navigate(dashboardRoutes[userRole] || '/');
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowRoleSelector(false);
    setSelectedRole(null);
    setError('');
  };

  if (showRoleSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-nba-dark via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="mb-8 text-white hover:text-gray-300 flex items-center gap-2 transition-colors"
          >
            <span className="text-2xl">←</span> Back
          </button>

          {/* Header */}
          <div className="text-center mb-12 slide-up">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Select Your Login Portal</h2>
            <p className="text-gray-300 text-lg">Choose your role to access the system</p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`cursor-pointer transform transition-all duration-300 hover:scale-105 ${
                  selectedRole === role.id ? 'scale-105 ring-4 ring-yellow-400' : ''
                }`}
              >
                <div className={`bg-gradient-to-br ${role.color} rounded-2xl p-8 shadow-2xl text-white text-center hover:shadow-3xl`}>
                  <div className="text-5xl mb-4">{role.name.split(' ')[0]}</div>
                  <h3 className="text-2xl font-bold mb-2">{role.name.split(' ').slice(1).join(' ')}</h3>
                  <p className="text-sm opacity-90 mb-4">{role.description}</p>
                  <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                    selectedRole === role.id ? 'bg-white text-gray-900' : 'bg-white bg-opacity-20'
                  }`}>
                    {selectedRole === role.id ? '✓ Selected' : 'Select'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Proceed Button */}
          {selectedRole && (
            <div className="mt-12 text-center slide-up">
              <button
                onClick={() => setActiveTab('login-form')}
                className="nba-btn-primary px-8 py-3 text-lg"
              >
                Continue with {roles.find(r => r.id === selectedRole)?.name.split(' ').slice(1).join(' ')} Login →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8 slide-up">
          <div className="inline-block mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-nba-dark to-gray-800 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white text-3xl font-bold">⚖️</span>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-nba-dark mb-2">NBA LITIGMUS</h1>
          <p className="text-gray-600">Nigerian Bar Association Case Management System</p>
        </div>

        {/* Main Card */}
        <div className="nba-card shadow-2xl">
          {/* Login Form */}
          <div className="nba-card-body space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 text-center">Secure Login</h2>

            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-900 rounded fade-in">
                {error}
                <button onClick={() => setError('')} className="ml-4 text-red-600 hover:text-red-800">✕</button>
              </div>
            )}

            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-gray-900 font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="nba-input"
                />
              </div>

              <div>
                <label className="block text-gray-900 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="nba-input"
                />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={handleLoginClick}
                className="w-full nba-btn-primary py-3 text-lg font-semibold"
              >
                {loading ? 'Loading...' : 'Continue to Login Options →'}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-600">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-center text-sm text-gray-600">Don't have an account?</p>
              <a href="/register" className="block w-full text-center py-2 px-4 border-2 border-nba-dark text-nba-dark rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                Create Account
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              Protected by SSL encryption | <a href="/privacy" className="text-nba-dark hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>🔒 Your data is secure | 🛡️ Verified Institution | ⚖️ Trusted by NBA</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
