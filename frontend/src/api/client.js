import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - attach auth token if available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle common errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }

      const message = data?.detail || data?.message || `Request failed with status ${status}`;
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection and try again.'));
    }

    return Promise.reject(error);
  }
);

// ---- Auth API ----
export const authAPI = {
  login: (username, password) =>
    client.post('/api/auth/login', { username, password }),
  getMe: () => client.get('/api/auth/me'),
};

// ---- Employees API ----
export const employeesAPI = {
  getByNik: (nik) => client.get(`/api/employees/${nik}`),
};

// ---- Items API ----
export const itemsAPI = {
  getAll: () => client.get('/api/items'),
  getById: (id) => client.get(`/api/items/${id}`),
  create: (data) => client.post('/api/items', data),
  update: (id, data) => client.put(`/api/items/${id}`, data),
  delete: (id) => client.delete(`/api/items/${id}`),
};

// ---- Borrowing API ----
export const borrowingAPI = {
  create: (data) => client.post('/api/borrow', data),
  getTransaction: (transactionId) => client.get(`/api/borrow/${transactionId}`),
  getHistory: (nik) => client.get(`/api/borrow/history/${nik}`),
  markReturned: (transactionId, notes) =>
    client.put(`/api/borrow/${transactionId}/return`, { notes }),
};

// ---- Admin API ----
export const adminAPI = {
  getDashboard: () => client.get('/api/admin/dashboard'),
  getTransactions: (params) => client.get('/api/admin/transactions', { params }),
  getOverdue: () => client.get('/api/admin/overdue'),
  sendReminder: (transactionId) => client.post(`/api/admin/remind/${transactionId}`),
  exportExcel: () =>
    client.get('/api/admin/export/excel', { responseType: 'blob' }),
  exportPdf: () =>
    client.get('/api/admin/export/pdf', { responseType: 'blob' }),
};

// ---- QR Code API ----
export const qrcodeAPI = {
  getUrl: (url) => `${API_URL}/api/qrcode?url=${encodeURIComponent(url)}`,
};

export default client;
