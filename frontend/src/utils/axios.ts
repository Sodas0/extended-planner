import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000',  // FastAPI backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Don't redirect to signin if already on signin page
    const isSigninPage = typeof window !== 'undefined' && window.location.pathname === '/signin';
    
    if (error.response?.status === 401 && !isSigninPage) {
      // Handle unauthorized error (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default instance; 