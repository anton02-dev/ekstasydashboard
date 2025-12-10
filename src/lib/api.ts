import axios from 'axios';
import { Product, Filter, WeightPrice, Category, Order } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to setup interceptors (will be called from AuthContext)
export const setupInterceptors = (logout: () => void, refreshUser: () => Promise<void>) => {
  // Request interceptor - attach access token to every request
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - handle token refresh and errors
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Use the refreshUser function from AuthContext
          await refreshUser();
          
          // Retry original request with new token
          const newToken = localStorage.getItem('access_token');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          await logout();
          return Promise.reject(refreshError);
        }
      }

      // If error is 403 (Admin access required)
      if (error.response?.status === 403) {
        alert('Admin access required. You need to be an administrator to perform this action.');
        await logout();
      }

      return Promise.reject(error);
    }
  );
};

// Your existing API methods
export const productsApi = {
  getAll: () => api.get<Product[]>('/products'),
  getById: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'id'>) => api.post<Product>('/products', { data }),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, { data }),
  delete: (id: number) => api.delete(`/products/${id}`),
  search: (query: string) => api.get<Product[]>(`/search/suggestions?q=${query}`),
};

export const ordersApi = {
  getAll: () => api.get<Order[]>('/orders'),
  getById: (id: number) => api.get<Order>(`/orders/${id}`),
  updateStatus: (id: number, status: string) => api.patch<Order>(`/orders/${id}`, { status }),
  delete: (id: number) => api.delete(`/orders/${id}`),
};

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories2'),
  create: (data: Omit<Category, 'id'>) => api.post<Category>('/categories', { data }),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, { data }),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

export const filtersApi = {
  getAll: () => api.get<Filter[]>('/filters2'),
  create: (data: Omit<Filter, 'id'>) => api.post<Filter>('/filters', { data }),
  update: (id: number, data: Partial<Filter>) => api.put<Filter>(`/filters/${id}`, { data }),
  delete: (id: number) => api.delete(`/filters/${id}`),
};

export const weightPricesApi = {
  getAll: () => api.get<WeightPrice[]>('/getWeightPrices'),
  update: (id: number, data: Partial<WeightPrice>) => api.put<WeightPrice>(`/weight-prices/${id}`, { data }),
};

export const analyticsApi = {
  getStats: () => api.get('/analytics/stats'),
  getRevenueData: () => api.get('/analytics/revenue'),
  getOrdersData: () => api.get('/analytics/orders'),
};