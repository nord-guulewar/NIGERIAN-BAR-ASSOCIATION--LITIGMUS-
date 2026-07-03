import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../services/firebase';
import {
  TAB_AUTH_ACTIVE_KEY,
  TAB_TOKEN_KEY,
  TAB_USER_KEY,
  clearStoredSession,
  getSessionToken
} from '../utils/sessionAuth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (token, userData) => {
    sessionStorage.setItem(TAB_AUTH_ACTIVE_KEY, 'true');
    sessionStorage.setItem(TAB_TOKEN_KEY, token);
    sessionStorage.setItem(TAB_USER_KEY, JSON.stringify(userData));

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const clearSession = () => {
    clearStoredSession();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const clearTabSessionOnly = () => {
    clearStoredSession();
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
  const WARNING_BEFORE_MS = 2 * 60 * 1000;

  useEffect(() => {
    const tabActive = sessionStorage.getItem(TAB_AUTH_ACTIVE_KEY) === 'true';
    const token = sessionStorage.getItem(TAB_TOKEN_KEY);
    const userData = sessionStorage.getItem(TAB_USER_KEY);

    if (tabActive && token && userData) {
      setUser(JSON.parse(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      clearTabSessionOnly();
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    let warningTimeout;
    let logoutTimeout;

    const clearTimers = () => {
      if (warningTimeout) window.clearTimeout(warningTimeout);
      if (logoutTimeout) window.clearTimeout(logoutTimeout);
    };

    const armTimers = () => {
      clearTimers();

      warningTimeout = window.setTimeout(() => {
        const stayLoggedIn = window.confirm(
          'Session reminder: you will be logged out in 2 minutes due to inactivity. Click OK to stay signed in.'
        );
        if (stayLoggedIn) {
          armTimers();
        }
      }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS);

      logoutTimeout = window.setTimeout(() => {
        logout();
        window.alert('You were logged out after 30 minutes of inactivity.');
      }, INACTIVITY_LIMIT_MS);
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const resetInactivity = () => armTimers();

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivity, { passive: true });
    });

    armTimers();

    return () => {
      clearTimers();
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivity);
      });
    };
  }, [user]);

  const login = async (email, password) => {
    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const idToken = await credential.user.getIdToken(true);
        const response = await axios.post('/api/auth/firebase/login', {
          idToken
        });

        const { token, user: userData } = response.data.data;
        saveSession(token, userData);

        return { success: true, provider: 'firebase' };
      } catch (error) {
        if (firebaseAuth?.currentUser) {
          await signOut(firebaseAuth).catch(() => {});
        }

        const backendStatus = error.response?.status;
        const backendMessage = error.response?.data?.message;
        const firebaseErrorCode = error.code;

        if (backendMessage && backendStatus !== 503 && !firebaseErrorCode) {
          return {
            success: false,
            message: backendMessage
          };
        }
      }
    }

    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token, user: userData } = response.data.data;

      saveSession(token, userData);
      
      return { success: true, provider: 'local' };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/admin/login', {
        email,
        password
      });

      const { token, user: userData } = response.data.data;

      saveSession(token, userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Admin login failed',
        data: error.response?.data?.data || null
      };
    }
  };

  const submitAdminUnlockRequest = async (payload) => {
    try {
      const response = await axios.post('/api/auth/admin/unlock-request', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit unlock request'
      };
    }
  };

  // Two-step verification login
  const loginStep1 = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/extended/login-step1', {
        email,
        password
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const verifyLoginCode = async (userId, code) => {
    try {
      const response = await axios.post('/api/auth/extended/login-verify', {
        userId,
        code
      });

      const { token, user: userData } = response.data.data;

      saveSession(token, userData);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Verification failed'
      };
    }
  };

  const resendVerificationCode = async (userId, method) => {
    try {
      const response = await axios.post('/api/auth/extended/resend-code', {
        userId,
        method
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend code'
      };
    }
  };

  const judgeLoginStep1 = async (identifier, password) => {
    try {
      const isStaffId = identifier && (identifier.includes('-') || identifier.length > 20);
      const payload = { password };
      if (isStaffId) {
        payload.staffId = identifier;
      } else {
        payload.email = identifier;
      }
      const response = await axios.post('/api/auth/judge/login-step1', payload);
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Judge login failed'
      };
    }
  };

  const judgeVerifyLoginCode = async (userId, code) => {
    try {
      const response = await axios.post('/api/auth/judge/login-verify', {
        userId,
        code
      });

      const { token, user: userData } = response.data.data;

      saveSession(token, userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Judge verification failed'
      };
    }
  };

  const judgeResendVerificationCode = async (userId) => {
    try {
      const response = await axios.post('/api/auth/judge/resend-code', {
        userId
      });
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend judge verification code'
      };
    }
  };

  const registerJudge = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register-judge', userData);
      const { user: newUser } = response.data.data;

      return {
        success: true,
        emailConfirmationRequired: true,
        user: newUser,
        offsiteAccess: response.data.data.offsiteAccess || null
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Judge registration failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      const { token, user: newUser } = response.data.data;
      const offsiteAccess = response.data.data?.offsiteAccess || null;
      const recoveryCode = offsiteAccess?.recoveryCode || newUser?.offlineRecoveryCode || null;

      if (token && newUser) {
        const updatedUser = { ...newUser, offlineRecoveryCode: recoveryCode };
        saveSession(token, updatedUser);

        return {
          success: true,
          emailConfirmationRequired: false,
          recoveryCode,
          offsiteAccess
        };
      }

      return {
        success: true,
        emailConfirmationRequired: true,
        user: newUser,
        recoveryCode,
        offsiteAccess
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const recoveryLogin = async (identifier, code) => {
    try {
      const response = await axios.post('/api/auth/recovery-login', {
        identifier,
        code
      });

      const { token, user: userData } = response.data.data;

      saveSession(token, userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Recovery login failed'
      };
    }
  };

  const requestRecoveryCode = async () => {
    try {
      const response = await axios.post('/api/auth/recovery-code');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Unable to generate recovery code'
      };
    }
  };

  const evaluateEmailRisk = async () => {
    try {
      const response = await axios.post('/api/auth/risk-evaluate');
      return { success: true, data: response.data.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Risk evaluation failed'
      };
    }
  };

  const reportIssue = async (category, message) => {
    try {
      const response = await axios.post('/api/admin/issues/report', {
        category,
        message
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to submit issue'
      };
    }
  };

  const logout = () => {
    if (firebaseAuth) {
      void signOut(firebaseAuth).catch(() => {});
    }
    clearSession();
  };

  const getCurrentToken = () => getSessionToken();

  const value = {
    user,
    login,
    adminLogin,
    submitAdminUnlockRequest,
    loginStep1,
    verifyLoginCode,
    resendVerificationCode,
    judgeLoginStep1,
    judgeVerifyLoginCode,
    judgeResendVerificationCode,
    register,
    registerJudge,
    recoveryLogin,
    requestRecoveryCode,
    evaluateEmailRisk,
    reportIssue,
    logout,
    getCurrentToken,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
