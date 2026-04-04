import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://daily-fix-nqm0.onrender.com',
    withCredentials: true,
});

export default api;

export const BASE_URL = import.meta.env.VITE_API_URL || 'https://daily-fix-nqm0.onrender.com';
