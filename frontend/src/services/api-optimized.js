/**
 * Optimized API Service with Caching
 * Reduces redundant API calls and improves performance
 */

import axios from 'axios';
import { CacheManager, debounce } from '../utils/performance';
import { clearStoredSession, getSessionToken } from '../utils/sessionAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'development' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cache for read operations (5 minutes TTL)
const queryCache = new CacheManager(5 * 60 * 1000);

api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Helper to cache GET requests
const cachedGet = async (url, params = null, cacheKey = null) => {
  const key = cacheKey || `${url}-${JSON.stringify(params)}`;
  
  const cached = queryCache.get(key);
  if (cached) {
    return cached;
  }

  try {
    const response = await api.get(url, params ? { params } : {});
    queryCache.set(key, response);
    return response;
  } catch (error) {
    throw error;
  }
};

// Clear cache on mutations
const clearCache = () => {
  queryCache.clear();
};

export const authAPI = {
  confirmEmail: (token) => api.post('/auth/confirm-email', { token }),
  resendConfirmation: (email) => api.post('/auth/resend-confirmation', { email }),
  login: (credentials) => {
    clearCache(); // Clear cache on login
    return api.post('/auth/login', credentials);
  },
  logout: () => {
    clearCache(); // Clear cache on logout
    return api.post('/auth/logout');
  },
  registerJudge: (data) => {
    clearCache();
    return api.post('/auth/register-judge', data);
  },
  judgeLoginStep1: (email, password) => {
    clearCache();
    return api.post('/auth/judge/login-step1', { email, password });
  },
  judgeLoginWithStaffId: (staffId, password) => {
    clearCache();
    return api.post('/auth/judge/login-step1', { staffId, password });
  },
  judgeVerifyLoginCode: (userId, code) => {
    clearCache();
    return api.post('/auth/judge/login-verify', { userId, code });
  },
  judgeResendCode: (userId) => api.post('/auth/judge/resend-code', { userId }),
  verifyBarRegistration: (barRegistrationNumber, email, context = {}) => api.post('/auth/verify-bar-registration', { barRegistrationNumber, email, ...context }),
  generateStaffId: (verificationToken, code, title, state, lga) => api.post('/auth/generate-staff-id', { verificationToken, code, title, state, lga }),
  requestStaffId: () => api.post('/auth/request-staff-id'),
  verifyStaffId: (code, state, lga) => api.post('/auth/verify-staff-id', { code, state, lga }),
  recoveryLogin: (identifier, code) => {
    clearCache();
    return api.post('/auth/recovery-login', { identifier, code });
  },
  recoveryCode: () => api.post('/auth/recovery-code'),
  riskEvaluate: () => api.post('/auth/risk-evaluate')
};

export const caseAPI = {
  getAll: (params) => cachedGet('/cases', params, 'cases-all'),
  getById: (id) => cachedGet(`/cases/${id}`, null, `case-${id}`),
  create: (data) => {
    clearCache();
    return api.post('/cases', data);
  },
  update: (id, data) => {
    clearCache();
    return api.put(`/cases/${id}`, data);
  },
  delete: (id) => {
    clearCache();
    return api.delete(`/cases/${id}`);
  },
  addHearing: (id, data) => {
    clearCache();
    return api.post(`/cases/${id}/hearing`, data);
  }
};

export const judgeAPI = {
  getAll: (params) => cachedGet('/judges', params, 'judges-all'),
  getById: (id) => cachedGet(`/judges/${id}`, null, `judge-${id}`),
  create: (data) => {
    clearCache();
    return api.post('/judges', data);
  },
  update: (id, data) => {
    clearCache();
    return api.put(`/judges/${id}`, data);
  },
  delete: (id) => {
    clearCache();
    return api.delete(`/judges/${id}`);
  },
  getWorkload: (id) => cachedGet(`/judges/${id}/workload`, null, `judge-workload-${id}`)
};

export const paymentAPI = {
  getAll: (params) => cachedGet('/payments', params, 'payments-all'),
  getById: (id) => cachedGet(`/payments/${id}`, null, `payment-${id}`),
  create: (data) => {
    clearCache();
    return api.post('/payments', data);
  },
  update: (id, data) => {
    clearCache();
    return api.put(`/payments/${id}`, data);
  },
  delete: (id) => {
    clearCache();
    return api.delete(`/payments/${id}`);
  },
  getDue: () => cachedGet('/payments/due', null, 'payments-due'),
  getOverdue: () => cachedGet('/payments/overdue', null, 'payments-overdue')
};

export const stateAPI = {
  getAll: () => cachedGet('/states', null, 'states-all'),
  getByCode: (code) => cachedGet(`/states/${code}`, null, `state-${code}`),
  getByZone: (zone) => cachedGet(`/states/zone/${zone}`, null, `zone-${zone}`)
};

export const courtAPI = {
  getAll: () => cachedGet('/courts', null, 'courts-all'),
  getByCode: (code) => cachedGet(`/courts/${code}`, null, `court-${code}`),
  getCaseTypes: () => cachedGet('/courts/types', null, 'case-types')
};

export const lgaAPI = {
  getAll: () => cachedGet('/lgas', null, 'lgas-all'),
  getByState: (stateCode) => cachedGet(`/lgas/state/${stateCode}`, null, `lgas-${stateCode}`),
  getCount: () => cachedGet('/lgas/count', null, 'lgas-count')
};

export const reportAPI = {
  getDashboard: () => cachedGet('/reports/dashboard', null, 'dashboard-report'),
  getMonthlyCases: (year) => cachedGet('/reports/cases/monthly', { year }, `monthly-cases-${year}`),
  getJudgePerformance: () => cachedGet('/reports/judges/performance', null, 'judge-performance'),
  getPaymentSummary: (params) => cachedGet('/reports/payments/summary', params, 'payment-summary')
};

export { clearCache, queryCache };
export default api;
