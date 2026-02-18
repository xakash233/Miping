import axios from 'axios';
import Cookies from 'js-cookie';

const instance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

instance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors, e.g., 401 Unauthorized -> Logout
        if (error.response?.status === 401) {
            // Optional: Redirect to login or clear cookies
            // Cookies.remove('token');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;
