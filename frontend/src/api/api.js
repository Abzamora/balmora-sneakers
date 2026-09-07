import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the admin JWT (if present) to every outgoing request. Public
// catalog endpoints simply ignore the header, so this is safe everywhere.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a protected request comes back 401 (expired/invalid token), clear the
// stale session so the admin panel bounces to the login screen cleanly.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('admin_user');
    }
    return Promise.reject(err);
  }
);

// ---- Public catalog ---------------------------------------------------------
export const fetchProducts = (params) => api.get('/products', { params }).then((r) => r.data);
export const fetchFacets = () => api.get('/products/facets').then((r) => r.data);
export const fetchProductBySlug = (slug) => api.get(`/products/${slug}`).then((r) => r.data);

// ---- Admin auth ---------------------------------------------------------------
export const loginAdmin = (credentials) => api.post('/auth/login', credentials).then((r) => r.data);
export const fetchMe = () => api.get('/auth/me').then((r) => r.data);

// ---- Admin product management ---------------------------------------------
export const fetchAllProductsAdmin = () => api.get('/products/admin/all').then((r) => r.data);
export const createProduct = (payload) => api.post('/products', payload).then((r) => r.data);
export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then((r) => r.data);
export const uploadProductImages = (id, formData) =>
  api.post(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
export const deleteProductImage = (id, publicId) =>
  api.delete(`/products/${id}/images/${encodeURIComponent(publicId)}`).then((r) => r.data);

export default api;
