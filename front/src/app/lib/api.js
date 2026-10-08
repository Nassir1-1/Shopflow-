import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8080`;
  }
  return 'http://192.168.1.110:8080';
};

const API = axios.create({ baseURL: getBaseURL() });

API.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;

// ── AUTH ─────────────────────────────────────────────
export const register = (data) => API.post('/api/auth/register', data);
export const login    = (data) => API.post('/api/auth/login', data);

// ── PRODUCTS — category-aware ────────────────────────
// category: 'CLASSIC_ART' | 'GRAPHIC_DESIGN' | undefined (all)
export const getProducts = async (page = 0, category) => {
  const params = new URLSearchParams({ page });
  if (category) params.append('category', category);
  const res = await API.get(`/api/products?${params}`);
  return { data: res.data.content || [] };
};

export const getProduct = (id) => API.get(`/api/products/${id}`);

export const searchProducts = async (q, category) => {
  const params = new URLSearchParams({ q });
  if (category) params.append('category', category);
  const res = await API.get(`/api/products/search?${params}`);
  return { data: res.data.content || [] };
};

export const createProduct  = (data)     => API.post('/api/products', data);
export const updateProduct  = (id, data) => API.put(`/api/products/${id}`, data);
export const deleteProduct  = (id)       => API.delete(`/api/products/${id}`);

// ── CART ─────────────────────────────────────────────
export const getCart        = ()                    => API.get('/api/cart');
export const addToCart      = (productId, quantite) =>
  API.post(`/api/cart/items?productId=${productId}&quantite=${quantite}`);
export const removeFromCart = (itemId)              => API.delete(`/api/cart/items/${itemId}`);

// ── ORDERS ───────────────────────────────────────────
export const placeOrder  = (data) => API.post('/api/orders', data);
export const getMyOrders = ()     => API.get('/api/orders/my');