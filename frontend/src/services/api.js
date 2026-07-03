import axios from 'axios';
import { clearStoredSession, getSessionToken } from '../utils/sessionAuth';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export const authAPI = {
  confirmEmail: (token) => api.post('/auth/confirm-email', { token }),
  resendConfirmation: (email) => api.post('/auth/resend-confirmation', { email }),
  login: (credentials) => api.post('/auth/login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin/login', credentials),
  adminUnlockRequest: (data) => api.post('/auth/admin/unlock-request', data),
  me: () => api.get('/auth/me'),
  deleteProfile: () => api.delete('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/password/forgot-password', { email }),
  verifyResetToken: (data) => api.post('/auth/password/verify-reset-token', data),
  resetPassword: (data) => api.post('/auth/password/reset-password', data),
  changePassword: (data) => api.post('/auth/password/change-password', data),
  registerJudge: (data) => api.post('/auth/register-judge', data),
  judgeLoginStep1: (email, password) => api.post('/auth/judge/login-step1', { email, password }),
  judgeLoginWithStaffId: (staffId, password) => api.post('/auth/judge/login-step1', { staffId, password }),
  judgeVerifyLoginCode: (userId, code) => api.post('/auth/judge/login-verify', { userId, code }),
  judgeResendCode: (userId) => api.post('/auth/judge/resend-code', { userId }),
  verifyBarRegistration: (barRegistrationNumber, email, context = {}) => api.post('/auth/verify-bar-registration', { barRegistrationNumber, email, ...context }),
  generateStaffId: (verificationToken, code, title, state, lga) => api.post('/auth/generate-staff-id', { verificationToken, code, title, state, lga }),
  requestStaffId: () => api.post('/auth/request-staff-id'),
  verifyStaffId: (code, state, lga) => api.post('/auth/verify-staff-id', { code, state, lga }),
  recoveryLogin: (identifier, code) => api.post('/auth/recovery-login', { identifier, code }),
  recoveryCode: () => api.post('/auth/recovery-code'),
  riskEvaluate: () => api.post('/auth/risk-evaluate')
};

export const caseAPI = {
  getAll: (params) => api.get('/cases', { params }),
  getById: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.put(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
  addHearing: (id, data) => api.post(`/cases/${id}/hearing`, data)
};

export const judgeAPI = {
  getAll: (params) => api.get('/judges', { params }),
  getById: (id) => api.get(`/judges/${id}`),
  create: (data) => api.post('/judges', data),
  update: (id, data) => api.put(`/judges/${id}`, data),
  delete: (id) => api.delete(`/judges/${id}`),
  getWorkload: (id) => api.get(`/judges/${id}/workload`)
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
  getDue: () => api.get('/payments/due'),
  getOverdue: () => api.get('/payments/overdue')
};

export const stateAPI = {
  getAll: () => api.get('/states'),
  getByCode: (code) => api.get(`/states/${code}`),
  getByZone: (zone) => api.get(`/states/zone/${zone}`)
};

export const courtAPI = {
  getAll: () => api.get('/courts'),
  getByCode: (code) => api.get(`/courts/${code}`),
  getCaseTypes: () => api.get('/courts/types')
};

export const lgaAPI = {
  getAll: () => api.get('/lgas'),
  getByState: (stateCode) => api.get(`/lgas/state/${stateCode}`),
  getCount: () => api.get('/lgas/count')
};

export const reportAPI = {
  getDashboard: () => api.get('/reports/dashboard'),
  getMonthlyCases: (year) => api.get('/reports/cases/monthly', { params: { year } }),
  getJudgePerformance: () => api.get('/reports/judges/performance'),
  getPaymentSummary: (params) => api.get('/reports/payments/summary', { params })
};

export default api;
