import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor للطلبات الصادرة (Request)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✨ الجديد: Interceptor للردود الواردة (Response)
api.interceptors.response.use(
  (response) => response, // لو الرد سليم عدي الحوار
  (error) => {
    // لو السيرفر رد بـ 401 يبقى الـ Token بايظة أو انتهت
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      // ممكن تعملي redirect لصفحة اللوجين هنا لو حابة
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;