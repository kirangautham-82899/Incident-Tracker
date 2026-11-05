import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Attach the auth token (if any) to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Called when the server says the session is no longer valid.
// The auth store registers its logout here (avoids a circular import).
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
    onUnauthorized = handler;
};

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');

        // A 401 on login just means wrong credentials; anywhere else the session expired
        if (status === 401 && !isAuthAttempt && localStorage.getItem('token') && onUnauthorized) {
            onUnauthorized();
        }
        return Promise.reject(error);
    }
);

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.request && !error?.response) return 'Cannot reach the server. Check your connection.';
    return error?.message || fallback;
};

export default api;
