import axios from 'axios';

// Prefer explicit env config; otherwise use same-origin and let Nginx proxy /api.
const defaultBaseUrl =
  typeof window !== 'undefined' && window.location && window.location.origin
    ? window.location.origin
    : 'http://localhost:3000';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || defaultBaseUrl;
axios.defaults.headers.common['Content-Type'] = 'application/json';

axios.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('token');
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', request);
    return request;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error);

    const requestUrl = error.config?.url || '';
    const isAuthSubmit =
      requestUrl.includes('/api/auth/login') || requestUrl.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthSubmit) {
      localStorage.removeItem('token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
